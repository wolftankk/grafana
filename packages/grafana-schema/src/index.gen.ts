// Code generated - EDITING IS FUTILE. DO NOT EDIT.
//
// Generated by:
//     kinds/gen.go
// Using jennies:
//     TSVeneerIndexJenny
//
// Run 'make gen-cue' from repository root to regenerate.

// Raw generated types from AccessPolicy kind.
export type {
  AccessPolicy,
  RoleRef,
  ResourceRef,
  AccessRule
} from './raw/accesspolicy/x/accesspolicy_types.gen';

// Raw generated enums and default consts from accesspolicy kind.
export { defaultAccessPolicy } from './raw/accesspolicy/x/accesspolicy_types.gen';

// Raw generated types from Dashboard kind.
export type {
  AnnotationTarget,
  AnnotationPanelFilter,
  VariableOption,
  DashboardLink,
  DashboardLinkType,
  VariableType,
  FieldColorSeriesByMode,
  FieldColor,
  GridPos,
  Threshold,
  ThresholdsConfig,
  ValueMapping,
  ValueMap,
  RangeMap,
  RegexMap,
  SpecialValueMap,
  ValueMappingResult,
  LibraryPanelRef
} from './raw/dashboard/x/dashboard_types.gen';

// Raw generated enums and default consts from dashboard kind.
export {
  defaultAnnotationTarget,
  defaultAnnotationPanelFilter,
  VariableRefresh,
  VariableSort,
  defaultDashboardLink,
  FieldColorModeId,
  defaultGridPos,
  ThresholdsMode,
  defaultThresholdsConfig,
  MappingType,
  SpecialValueMatch,
  DashboardCursorSync,
  defaultDashboardCursorSync
} from './raw/dashboard/x/dashboard_types.gen';

// The following exported declarations correspond to types in the dashboard@0.0 kind's
// schema with attribute @grafana(TSVeneer="type").
//
// The handwritten file for these type and default veneers is expected to be at
// packages/grafana-schema/src/veneer/dashboard.types.ts.
// This re-export declaration enforces that the handwritten veneer file exists,
// and exports all the symbols in the list.
//
// TODO generate code such that tsc enforces type compatibility between raw and veneer decls
export type {
  Dashboard,
  AnnotationContainer,
  AnnotationQuery,
  VariableModel,
  DataSourceRef,
  DataTransformerConfig,
  TimePickerConfig,
  Panel,
  FieldConfigSource,
  MatcherConfig,
  FieldConfig,
  RowPanel
} from './veneer/dashboard.types';

// The following exported declarations correspond to types in the dashboard@0.0 kind's
// schema with attribute @grafana(TSVeneer="type").
//
// The handwritten file for these type and default veneers is expected to be at
// packages/grafana-schema/src/veneer/dashboard.types.ts.
// This re-export declaration enforces that the handwritten veneer file exists,
// and exports all the symbols in the list.
//
// TODO generate code such that tsc enforces type compatibility between raw and veneer decls
export {
  defaultDashboard,
  defaultAnnotationContainer,
  defaultAnnotationQuery,
  defaultVariableModel,
  VariableHide,
  defaultTimePickerConfig,
  defaultPanel,
  defaultFieldConfigSource,
  defaultMatcherConfig,
  defaultFieldConfig,
  defaultRowPanel
} from './veneer/dashboard.types';

// Raw generated types from Folder kind.
export type { Folder } from './raw/folder/x/folder_types.gen';

// Raw generated types from LibraryPanel kind.
export type {
  LibraryElementDTOMetaUser,
  LibraryElementDTOMeta
} from './raw/librarypanel/x/librarypanel_types.gen';

// The following exported declarations correspond to types in the librarypanel@0.0 kind's
// schema with attribute @grafana(TSVeneer="type").
//
// The handwritten file for these type and default veneers is expected to be at
// packages/grafana-schema/src/veneer/librarypanel.types.ts.
// This re-export declaration enforces that the handwritten veneer file exists,
// and exports all the symbols in the list.
//
// TODO generate code such that tsc enforces type compatibility between raw and veneer decls
export type { LibraryPanel } from './veneer/librarypanel.types';

// Raw generated types from Preferences kind.
export type {
  Preferences,
  QueryHistoryPreference,
  CookiePreferences
} from './raw/preferences/x/preferences_types.gen';

// Raw generated types from PublicDashboard kind.
export type { PublicDashboard } from './raw/publicdashboard/x/publicdashboard_types.gen';

// Raw generated types from Role kind.
export type { Role } from './raw/role/x/role_types.gen';

// Raw generated types from RoleBinding kind.
export type {
  RoleBinding,
  CustomRoleRef,
  BuiltinRoleRef,
  RoleBindingSubject
} from './raw/rolebinding/x/rolebinding_types.gen';

// Raw generated types from Team kind.
export type { Team } from './raw/team/x/team_types.gen';
