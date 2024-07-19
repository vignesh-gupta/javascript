import { useUser } from '@clerk/shared/react';
import React from 'react';

import { useRouter } from '../../../ui/router';
import { ORGANIZATION_SWITCHER_ITEM_ID } from '../../constants';
import { descriptors, localizationKeys } from '../../customizables';
import { Action } from '../../elements';
import { Add } from '../../icons';
import type { MenuItem } from '../../utils/createCustomMenuItems';
import { UserInvitationSuggestionList } from './UserInvitationSuggestionList';
import type { UserMembershipListProps } from './UserMembershipList';
import { UserMembershipList } from './UserMembershipList';
export interface OrganizationActionListProps extends UserMembershipListProps {
  onCreateOrganizationClick: React.MouseEventHandler;
  menuItems?: MenuItem[];
  completedCallback: () => void;
}

const CreateOrganizationButton = ({
  onCreateOrganizationClick,
}: Pick<OrganizationActionListProps, 'onCreateOrganizationClick'>) => {
  const { user } = useUser();

  if (!user?.createOrganizationEnabled) {
    return null;
  }

  return (
    <Action
      elementDescriptor={descriptors.organizationSwitcherPopoverActionButton}
      elementId={descriptors.organizationSwitcherPopoverActionButton.setId('createOrganization')}
      iconBoxElementDescriptor={descriptors.organizationSwitcherPopoverActionButtonIconBox}
      iconBoxElementId={descriptors.organizationSwitcherPopoverActionButtonIconBox.setId('createOrganization')}
      iconElementDescriptor={descriptors.organizationSwitcherPopoverActionButtonIcon}
      iconElementId={descriptors.organizationSwitcherPopoverActionButtonIcon.setId('createOrganization')}
      icon={Add}
      label={localizationKeys('organizationSwitcher.action__createOrganization')}
      onClick={onCreateOrganizationClick}
      sx={t => ({
        padding: `${t.space.$5} ${t.space.$5}`,
      })}
      iconSx={t => ({
        width: t.sizes.$9,
        height: t.sizes.$6,
      })}
      iconBoxSx={t => ({
        width: t.sizes.$9,
        height: t.sizes.$6,
      })}
      spinnerSize='sm'
    />
  );
};

export const OrganizationActionList = (props: OrganizationActionListProps) => {
  const { onCreateOrganizationClick, onPersonalWorkspaceClick, onOrganizationClick, menuItems, completedCallback } =
    props;
  const { navigate } = useRouter();

  const handleActionClick = async (route: MenuItem) => {
    if (route?.external) {
      await navigate(route.path);
      return completedCallback?.();
    }

    route.onClick?.();
    return props?.completedCallback();
  };

  return (
    <>
      <UserInvitationSuggestionList onOrganizationClick={onOrganizationClick} />
      <UserMembershipList {...{ onPersonalWorkspaceClick, onOrganizationClick }} />
      {menuItems?.map((item: MenuItem) => {
        if (item.id === ORGANIZATION_SWITCHER_ITEM_ID.CREATE_ORGANIZATION) {
          return (
            <CreateOrganizationButton
              key={item.id}
              {...{ onCreateOrganizationClick }}
            />
          );
        }
        return (
          <Action
            key={item.id}
            elementDescriptor={descriptors.organizationSwitcherPopoverCustomItem}
            elementId={descriptors.organizationSwitcherPopoverCustomItem.setId(item.id)}
            iconBoxElementDescriptor={descriptors.organizationSwitcherPopoverCustomItemIconBox}
            iconBoxElementId={descriptors.organizationSwitcherPopoverCustomItemIconBox.setId(item.id)}
            iconElementDescriptor={descriptors.organizationSwitcherPopoverCustomItemIcon}
            iconElementId={descriptors.organizationSwitcherPopoverCustomItemIcon.setId(item.id)}
            icon={item.icon}
            label={item.name}
            onClick={() => handleActionClick(item)}
            sx={t => ({
              padding: `${t.space.$4} ${t.space.$5}`,
            })}
            iconSx={t => ({
              width: t.sizes.$6,
              height: t.sizes.$6,
            })}
            iconBoxSx={t => ({
              width: t.sizes.$6,
              height: t.sizes.$6,
            })}
          />
        );
      })}
    </>
  );
};
