import type { ActiveSessionResource } from '@clerk/types';

import type { ElementDescriptor, ElementId } from '../../../ui/customizables/elementDescriptors';
import { useRouter } from '../../../ui/router';
import { USER_BUTTON_ITEM_ID } from '../../constants';
import { useUserButtonContext } from '../../contexts';
import type { LocalizationKey } from '../../customizables';
import { descriptors, Flex, localizationKeys } from '../../customizables';
import { Action, Actions, PreviewButton, SmallAction, SmallActions, UserPreview } from '../../elements';
import { Add, CogFilled, SignOut, SwitchArrowRight } from '../../icons';
import type { ThemableCssProp } from '../../styledSystem';
import type { MenuItem } from '../../utils/createCustomMenuItems';

type SingleSessionActionsProps = {
  handleManageAccountClicked: () => Promise<unknown> | void;
  handleSignOutSessionClicked: (session: ActiveSessionResource) => () => Promise<unknown> | void;
  session: ActiveSessionResource;
  completedCallback: () => void;
};

export const SingleSessionActions = (props: SingleSessionActionsProps) => {
  const { navigate } = useRouter();
  const { handleManageAccountClicked, handleSignOutSessionClicked, session } = props;

  const { customMenuItems } = useUserButtonContext();

  const handleActionClick = async (route: MenuItem) => {
    if (route?.external) {
      await navigate(route.path);
      return props?.completedCallback();
    }
    if (route.id === USER_BUTTON_ITEM_ID.MANAGE_ACCOUNT) {
      return await handleManageAccountClicked();
    }

    route.onClick?.();
    return props?.completedCallback();
  };

  return (
    <Actions
      role='menu'
      elementDescriptor={descriptors.userButtonPopoverActions}
      elementId={descriptors.userButtonPopoverActions.setId('singleSession')}
      sx={t => ({
        borderTopWidth: t.borderWidths.$normal,
        borderTopStyle: t.borderStyles.$solid,
        borderTopColor: t.colors.$neutralAlpha100,
      })}
    >
      {customMenuItems?.map((item: MenuItem) => {
        return (
          <Action
            key={item.id}
            elementDescriptor={descriptors.userButtonPopoverCustomActionButton}
            elementId={descriptors.userButtonPopoverCustomActionButton.setId(item.id)}
            iconBoxElementDescriptor={descriptors.userButtonPopoverCustomActionButtonIconBox}
            iconBoxElementId={descriptors.userButtonPopoverCustomActionButtonIconBox.setId(item.id)}
            iconElementDescriptor={descriptors.userButtonPopoverActionCustomButtonIcon}
            iconElementId={descriptors.userButtonPopoverActionCustomButtonIcon.setId(item.id)}
            icon={CogFilled} // TODO: Fix this
            // icon={item.icon} // TODO: Fix this
            label={item.name}
            onClick={
              item.id === USER_BUTTON_ITEM_ID.SIGN_OUT
                ? handleSignOutSessionClicked(session)
                : () => handleActionClick(item)
            }
            sx={t => ({
              borderTopWidth: t.borderWidths.$normal,
              borderTopStyle: t.borderStyles.$solid,
              borderTopColor: t.colors.$neutralAlpha100,
              padding: `${t.space.$4} ${t.space.$5}`,
            })}
          />
        );
      })}
    </Actions>
  );
};

type MultiSessionActionsProps = {
  handleManageAccountClicked: () => Promise<unknown> | void;
  handleSignOutSessionClicked: (session: ActiveSessionResource) => () => Promise<unknown> | void;
  handleSessionClicked: (session: ActiveSessionResource) => () => Promise<unknown> | void;
  handleAddAccountClicked: () => Promise<unknown> | void;
  session: ActiveSessionResource;
  otherSessions: ActiveSessionResource[];
};

export const MultiSessionActions = (props: MultiSessionActionsProps) => {
  const {
    handleManageAccountClicked,
    handleSignOutSessionClicked,
    handleSessionClicked,
    handleAddAccountClicked,
    session,
    otherSessions,
  } = props;

  return (
    <>
      <SmallActions
        role='menu'
        elementDescriptor={descriptors.userButtonPopoverActions}
        elementId={descriptors.userButtonPopoverActions.setId('multiSession')}
      >
        <Flex
          justify='between'
          sx={t => ({ marginLeft: t.space.$12, padding: `0 ${t.space.$5} ${t.space.$4}`, gap: t.space.$2 })}
        >
          <SmallAction
            elementDescriptor={descriptors.userButtonPopoverActionButton}
            elementId={descriptors.userButtonPopoverActionButton.setId('manageAccount')}
            iconBoxElementDescriptor={descriptors.userButtonPopoverActionButtonIconBox}
            iconBoxElementId={descriptors.userButtonPopoverActionButtonIconBox.setId('manageAccount')}
            iconElementDescriptor={descriptors.userButtonPopoverActionButtonIcon}
            iconElementId={descriptors.userButtonPopoverActionButtonIcon.setId('manageAccount')}
            icon={CogFilled}
            label={localizationKeys('userButton.action__manageAccount')}
            onClick={handleManageAccountClicked}
          />
          <SmallAction
            elementDescriptor={descriptors.userButtonPopoverActionButton}
            elementId={descriptors.userButtonPopoverActionButton.setId('signOut')}
            iconBoxElementDescriptor={descriptors.userButtonPopoverActionButtonIconBox}
            iconBoxElementId={descriptors.userButtonPopoverActionButtonIconBox.setId('signOut')}
            iconElementDescriptor={descriptors.userButtonPopoverActionButtonIcon}
            iconElementId={descriptors.userButtonPopoverActionButtonIcon.setId('signOut')}
            icon={SignOut}
            label={localizationKeys('userButton.action__signOut')}
            onClick={handleSignOutSessionClicked(session)}
          />
        </Flex>
      </SmallActions>
      <Actions
        role='menu'
        sx={t => ({
          borderTopStyle: t.borderStyles.$solid,
          borderTopWidth: t.borderWidths.$normal,
          borderTopColor: t.colors.$neutralAlpha100,
        })}
      >
        {otherSessions.map(session => (
          <PreviewButton
            key={session.id}
            icon={SwitchArrowRight}
            onClick={handleSessionClicked(session)}
            role='menuitem'
          >
            <UserPreview user={session.user} />
          </PreviewButton>
        ))}
        <Action
          elementDescriptor={descriptors.userButtonPopoverActionButton}
          elementId={descriptors.userButtonPopoverActionButton.setId('addAccount')}
          iconBoxElementDescriptor={descriptors.userButtonPopoverActionButtonIconBox}
          iconBoxElementId={descriptors.userButtonPopoverActionButtonIconBox.setId('addAccount')}
          iconElementDescriptor={descriptors.userButtonPopoverActionButtonIcon}
          iconElementId={descriptors.userButtonPopoverActionButtonIcon.setId('addAccount')}
          icon={Add}
          label={localizationKeys('userButton.action__addAccount')}
          onClick={handleAddAccountClicked}
          iconSx={t => ({
            width: t.sizes.$9,
            height: t.sizes.$6,
          })}
          iconBoxSx={t => ({
            minHeight: t.sizes.$9,
            minWidth: t.sizes.$6,
            alignItems: 'center',
          })}
          spinnerSize='md'
        />
      </Actions>
    </>
  );
};

type SignOutAllActionsProps = {
  handleSignOutAllClicked: () => Promise<unknown> | void;
  elementDescriptor?: ElementDescriptor;
  elementId?: ElementId;
  iconBoxElementDescriptor?: ElementDescriptor;
  iconBoxElementId?: ElementId;
  iconElementDescriptor?: ElementDescriptor;
  iconElementId?: ElementId;
  label?: LocalizationKey;
  sx?: ThemableCssProp;
  actionSx?: ThemableCssProp;
};

export const SignOutAllActions = (props: SignOutAllActionsProps) => {
  const {
    handleSignOutAllClicked,
    elementDescriptor,
    elementId,
    iconBoxElementDescriptor,
    iconBoxElementId,
    iconElementDescriptor,
    iconElementId,
    label,
    sx,
    actionSx,
  } = props;
  return (
    <Actions
      role='menu'
      sx={[
        t => ({
          padding: t.space.$2,
        }),
        sx,
      ]}
    >
      <Action
        elementDescriptor={elementDescriptor || descriptors.userButtonPopoverActionButton}
        elementId={elementId || descriptors.userButtonPopoverActionButton.setId('signOutAll')}
        iconBoxElementDescriptor={iconBoxElementDescriptor || descriptors.userButtonPopoverActionButtonIconBox}
        iconBoxElementId={iconBoxElementId || descriptors.userButtonPopoverActionButtonIconBox.setId('signOutAll')}
        iconElementDescriptor={iconElementDescriptor || descriptors.userButtonPopoverActionButtonIcon}
        iconElementId={iconElementId || descriptors.userButtonPopoverActionButtonIcon.setId('signOutAll')}
        icon={SignOut}
        label={label || localizationKeys('userButton.action__signOutAll')}
        onClick={handleSignOutAllClicked}
        variant='ghost'
        colorScheme='neutral'
        sx={[
          t => ({
            backgroundColor: t.colors.$transparent,
            padding: `${t.space.$2} ${t.space.$3}`,
            borderBottomWidth: 0,
            borderRadius: t.radii.$lg,
          }),
          actionSx,
        ]}
        spinnerSize='md'
      />
    </Actions>
  );
};
