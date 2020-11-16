package notifiers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"os"
	"time"

	"github.com/grafana/grafana/pkg/bus"

	"github.com/bluele/gcache"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/alerting"
)

var (
	feishuAPIURL           = "https://open.feishu.cn/open-apis"
	feishuAccessTokenCache = gcache.New(1).Simple().Build()
)

func init() {

	alerting.RegisterNotifier(&alerting.NotifierPlugin{
		Type:        "feishu",
		Name:        "Feishu",
		Heading:     "Sends notifications to feishu/lark.",
		Description: "Feishu API settings",
		Factory:     newFeishuNotifier,
		OptionsTemplate: `
			<h3 class="page-heading">Telegram API settings</h3>
			<div class="gf-form">
        		<span class="gf-form-label width-9">Url</span>
        		<input type="text" required class="gf-form-input max-width-70" ng-model="ctrl.model.settings.url" placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxxxxxxxxxxx"></input>
      		</div>
			<div class="gf-form">
        		<span class="gf-form-label width-9">App ID</span>
        		<input type="text" required class="gf-form-input" ng-model="ctrl.model.settings.appId"></input>
				<info-popover mode="right-absolute">only for uploading image</info-popover>
      		</div>
			<div class="gf-form">
        		<span class="gf-form-label width-9">App Secret</span>
        		<input type="text" required class="gf-form-input" ng-model="ctrl.model.settings.appSecret"></input>
      		</div>
		`,
		Options: []alerting.NotifierOption{
			{
				Label:        "Url",
				Element:      alerting.ElementTypeInput,
				InputType:    alerting.InputTypeText,
				Placeholder:  "https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxxxxxxxxxxx",
				PropertyName: "url",
				Required:     true,
			},
			{
				Label:        "App Id",
				Element:      alerting.ElementTypeInput,
				InputType:    alerting.InputTypeText,
				PropertyName: "appId",
				Required:     true,
				Description:  "only for uploading image",
			},
			{
				Label:        "App Secret",
				Element:      alerting.ElementTypeInput,
				InputType:    alerting.InputTypePassword,
				PropertyName: "appSecret",
				Required:     true,
			},
			{
				Label:        "Message type",
				Element:      alerting.ElementTypeSelect,
				PropertyName: "msgType",
				Required:     true,
				SelectOptions: []alerting.SelectOption{
					{
						Label: "Post",
						Value: "post",
					},
					{
						Label: "Interactive",
						Value: "interactive",
					},
				},
			},
		},
	})
}

type FeishuNotifier struct {
	NotifierBase

	Url         string
	AppID       string
	AppSecret   string
	MessageType string
	log         log.Logger
}

func newFeishuNotifier(model *models.AlertNotification) (alerting.Notifier, error) {
	if model.Settings == nil {
		return nil, alerting.ValidationError{Reason: "No Settings Supplied"}
	}

	url := model.Settings.Get("url").MustString()
	appId := model.Settings.Get("appId").MustString()
	appSecret := model.Settings.Get("appSecret").MustString()

	if url == "" || appId == "" || appSecret == "" {
		return nil, alerting.ValidationError{Reason: "Could not find Bot AppID or AppSecret in settings"}
	}

	return &FeishuNotifier{
		NotifierBase: NewNotifierBase(model),
		Url:          url,
		AppID:        appId,
		AppSecret:    appSecret,
		log:          log.New("alerting.notifier.feishu"),
	}, nil
}

type feishuImage struct {
	Code    int64  `json:"code"`
	Message string `json:"msg"`
	Data    struct {
		ImageKey string `json:"image_key"`
	} `json:"data"`
}

//https://open.feishu.cn/document/ukTMukTMukTM/uEDO04SM4QjLxgDN
func (fn *FeishuNotifier) uploadImage(imagePath string) (string, error) {
	tentantAccessToken, err := fn.getTenantAccessToken()

	if err != nil {
		return "", err
	}

	image, err := os.Open(imagePath)
	if err != nil {
		return "", err
	}
	defer image.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("image", imagePath)
	if err != nil {
		return "", err
	}
	_, err = io.Copy(part, image)
	writer.WriteField("image_type", "message")

	err = writer.Close()
	if err != nil {
		return "", err
	}

	request, err := http.NewRequest("POST", feishuAPIURL+"/image/v4/put/", body)
	request.Header.Set("Content-Type", writer.FormDataContentType())
	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", tentantAccessToken))

	client := http.Client{}
	resp, err := client.Do(request)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	imageInfo := &feishuImage{}
	err = json.Unmarshal(b, imageInfo)
	if err != nil {
		return "", err
	}

	return imageInfo.Data.ImageKey, nil
}

type feishuTenant struct {
	Code        int64  `json:"code"`
	Expire      int64  `json:"expire"`
	Message     string `json:"msg"`
	AccessToken string `json:"tenant_access_token"`
}

//https://open.feishu.cn/document/ukTMukTMukTM/uIjNz4iM2MjLyYzM
func (fn *FeishuNotifier) getTenantAccessToken() (string, error) {
	k, err := feishuAccessTokenCache.Get("tentant")
	if err == nil {
		return k.(string), nil
	}

	bodyMsg, err := json.Marshal(map[string]string{
		"app_id":     fn.AppID,
		"app_secret": fn.AppSecret,
	})

	if err != nil {
		return "", err
	}

	resp, err := http.Post(feishuAPIURL+"/auth/v3/tenant_access_token/internal/",
		"application/json",
		bytes.NewReader(bodyMsg),
	)

	if err != nil {
		return "", err
	}

	defer resp.Body.Close()

	b, err := ioutil.ReadAll(resp.Body)

	if err != nil {
		return "", err
	}

	tenantInfo := &feishuTenant{}

	if err := json.Unmarshal(b, tenantInfo); err != nil {
		return "", err
	}

	feishuAccessTokenCache.SetWithExpire("tentant", tenantInfo.AccessToken, time.Duration(tenantInfo.Expire)*time.Second)

	return tenantInfo.AccessToken, nil
}

func (fn *FeishuNotifier) Notify(evalContext *alerting.EvalContext) error {
	//build message
	body, err := fn.genBody(evalContext)
	if err != nil {
		return err
	}

	cmd := &models.SendWebhookSync{
		Url:        fn.Url,
		Body:       string(body),
		HttpMethod: "POST",
	}

	if err := bus.DispatchCtx(evalContext.Ctx, cmd); err != nil {
		fn.log.Error("Failed to send feishu", "error", err, "webhook", fn.Name)
		return err
	}

	return nil
}

type feishuTextContent struct {
	Tag      string `json:"tag"`
	Text     string `json:"text"`
	Unescape bool   `json:"un_escape"`
}

type feishuLinkContent struct {
	Tag  string `json:"tag"`
	Text string `json:"text"`
	Link string `json:"href"`
}

type feishuImageContent struct {
	Tag      string `json:"tag"`
	ImageKey string `json:"image_key"`
}

type feishuContent struct {
	MessageType string      `json:"msg_type"`
	Content     interface{} `json:"content"`
}

type feishuPost struct {
	Title   string        `json:"title"`
	Content []interface{} `json:"content"`
}

func (fn *FeishuNotifier) genBody(evalContext *alerting.EvalContext) ([]byte, error) {
	imageID, err := fn.uploadImage(evalContext.ImageOnDiskPath)

	if err != nil {
		fn.log.Error("failed upload image", "error", err)
		return nil, err
	}

	ruleURL, err := evalContext.GetRuleURL()
	if err != nil {
		return nil, err
	}

	title := evalContext.GetNotificationTitle()

	contents := make([]interface{}, 0)

	if len(evalContext.Rule.Message) > 0 {
		contents = append(contents, feishuTextContent{
			Tag:  "text",
			Text: evalContext.Rule.Message,
		})
	}

	for _, evt := range evalContext.EvalMatches {
		contents = append(contents, feishuTextContent{
			Tag:  "text",
			Text: fmt.Sprintf("%s: %s", evt.Metric, evt.Value),
		})
	}

	contents = append(contents, feishuImageContent{
		Tag:      "image",
		ImageKey: imageID,
	})

	if len(ruleURL) > 0 {
		contents = append(contents, feishuLinkContent{
			Tag:  "a",
			Text: string(evalContext.GetNewState()),
			Link: ruleURL,
		})
	}

	post := feishuContent{
		MessageType: "post",
		Content: map[string]interface{}{
			"post": map[string]feishuPost{
				"zh_cn": {
					Title:   title,
					Content: contents,
				},
			},
		},
	}

	p, err := json.Marshal(post)

	if err != nil {
		return nil, err
	}

	return p, nil
}
