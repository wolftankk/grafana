import { css } from '@emotion/css';
import React from 'react';
import { useForm } from 'react-hook-form';

import { GrafanaTheme2, SelectableValue } from '@grafana/data/src';
import { selectors as e2eSelectors } from '@grafana/e2e-selectors/src';
import {
  Button,
  ButtonGroup,
  Field,
  Input,
  InputControl,
  RadioButtonGroup,
  Spinner,
  useStyles2,
} from '@grafana/ui/src';
import {
  useAddEmailSharingMutation,
  useDeleteEmailSharingMutation,
  useGetPublicDashboardQuery,
  useUpdatePublicDashboardMutation,
} from 'app/features/dashboard/api/publicDashboardApi';
import { useSelector } from 'app/types';

import { PublicDashboardShareType, validEmailRegex } from '../SharePublicDashboardUtils';

interface EmailSharingConfigurationForm {
  shareType: PublicDashboardShareType;
  email: string;
}

const options: Array<SelectableValue<PublicDashboardShareType>> = [
  { label: 'Anyone with a link', value: PublicDashboardShareType.PUBLIC },
  { label: 'Only specified people', value: PublicDashboardShareType.EMAIL },
];

const selectors = e2eSelectors.pages.ShareDashboardModal.PublicDashboard.EmailSharingConfiguration;

const EmailList = ({
  recipients,
  dashboardUid,
  publicDashboardUid,
}: {
  recipients: string[];
  dashboardUid: string;
  publicDashboardUid: string;
}) => {
  const styles = useStyles2(getStyles);
  const [deleteEmail, { isLoading: isDeleteLoading }] = useDeleteEmailSharingMutation();

  const onDeleteEmail = (email: string) => {
    deleteEmail({ recipient: email, dashboardUid: dashboardUid, uid: publicDashboardUid });
  };

  return (
    <table className={styles.table} data-testid={selectors.EmailSharingList}>
      <tbody>
        {recipients.map((recipient) => (
          <tr key={recipient}>
            <td>{recipient}</td>
            <td>
              <ButtonGroup className={styles.tableButtonsContainer}>
                <Button
                  type="button"
                  variant="destructive"
                  fill="text"
                  aria-label="Revoke"
                  title="Revoke"
                  size="sm"
                  disabled={isDeleteLoading}
                  onClick={() => onDeleteEmail(recipient)}
                >
                  Revoke
                </Button>
              </ButtonGroup>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const EmailSharingConfiguration = () => {
  const styles = useStyles2(getStyles);
  const dashboardState = useSelector((store) => store.dashboard);
  const dashboard = dashboardState.getModel()!;

  const { data: publicDashboard } = useGetPublicDashboardQuery(dashboard.uid);
  const [updateShareType] = useUpdatePublicDashboardMutation();
  const [addEmail, { isLoading: isAddEmailLoading }] = useAddEmailSharingMutation();

  const {
    register,
    setValue,
    control,
    watch,
    handleSubmit,
    formState: { isValid, errors },
    reset,
  } = useForm<EmailSharingConfigurationForm>({
    defaultValues: {
      shareType: publicDashboard?.share || PublicDashboardShareType.PUBLIC,
      email: '',
    },
    mode: 'onChange',
  });

  const onShareTypeChange = (shareType: PublicDashboardShareType) => {
    const req = {
      dashboard,
      payload: {
        ...publicDashboard!,
        share: shareType,
      },
    };

    updateShareType(req);
  };

  const onSubmit = async (data: EmailSharingConfigurationForm) => {
    await addEmail({ recipient: data.email, uid: publicDashboard!.uid, dashboardUid: dashboard.uid }).unwrap();
    reset({ email: '', shareType: PublicDashboardShareType.EMAIL });
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
      <Field label="Can view dashboard">
        <InputControl
          name="shareType"
          control={control}
          render={({ field }) => {
            const { ref, ...rest } = field;
            return (
              <RadioButtonGroup
                {...rest}
                options={options}
                onChange={(shareType: PublicDashboardShareType) => {
                  setValue('shareType', shareType);
                  onShareTypeChange(shareType);
                }}
              />
            );
          }}
        />
      </Field>
      {watch('shareType') === PublicDashboardShareType.EMAIL && (
        <>
          <Field
            label="Invite"
            description="Invite people by email"
            error={errors.email?.message}
            invalid={!!errors.email?.message || undefined}
          >
            <div className={styles.emailContainer}>
              <Input
                className={styles.emailInput}
                placeholder="email"
                autoCapitalize="none"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: validEmailRegex, message: 'Invalid email' },
                })}
                data-testid={selectors.EmailSharingInput}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || isAddEmailLoading}
                data-testid={selectors.EmailSharingInviteButton}
              >
                Invite {isAddEmailLoading && <Spinner />}
              </Button>
            </div>
          </Field>
          {!!publicDashboard?.recipients?.length && (
            <EmailList
              recipients={publicDashboard.recipients}
              dashboardUid={dashboard.uid}
              publicDashboardUid={publicDashboard.uid}
            />
          )}
        </>
      )}
    </form>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  emailContainer: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  emailInput: css`
    flex-grow: 1;
  `,
  table: css`
    display: flex;
    max-height: 220px;
    overflow-y: scroll;
    margin-bottom: ${theme.spacing(1)};

    & tbody {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    & tr {
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: ${theme.spacing(0.5, 1)};

      :nth-child(odd) {
        background: ${theme.colors.background.secondary};
      }
    }
  `,
  tableButtonsContainer: css`
    display: flex;
    justify-content: end;
  `,
});
