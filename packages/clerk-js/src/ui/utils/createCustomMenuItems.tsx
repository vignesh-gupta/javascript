import type { CustomMenuItem, LoadedClerk } from '@clerk/types';

import { isValidUrl } from '../../utils';
import { ORGANIZATION_SWITCHER_ITEM_ID, USER_BUTTON_ITEM_ID } from '../constants';
import type { LocalizationKey } from '../customizables';
import { Add, CogFilled, SignOut } from '../icons';
import { localizationKeys } from '../localization';
import { ExternalElementMounter } from './ExternalElementMounter';
import { isDevelopmentSDK } from './runtimeEnvironment';

export type DefaultItemIds = 'manageAccount' | 'addAccount' | 'signOut' | 'signOutAll';

export type MenuItem = {
  id: string;
  name: LocalizationKey | string;
  icon: React.ComponentType;
  onClick?: () => void;
} & ({ external: true; path: string } | { id: string; external?: false; path?: string });

type MenuReorderItem = {
  label: 'manageAccount' | 'signOut' | 'createOrganization';
};

type CustomMenuAction = {
  label: string;
  onClick: () => void;
  mountIcon: (el: HTMLDivElement) => void;
  unmountIcon: (el?: HTMLDivElement) => void;
  mount: (el: HTMLDivElement) => void;
  unmount: (el?: HTMLDivElement) => void;
};

type CustomMenuLink = {
  label: string;
  href: string;
  mountIcon: (el: HTMLDivElement) => void;
  unmountIcon: (el?: HTMLDivElement) => void;
};

type CreateCustomMenuItemsParams = {
  customMenuItems: CustomMenuItem[];
  getDefaultMenuItems: () => { INITIAL_MENU_ITEMS: MenuItem[]; validReorderItemLabels: string[] };
};

export const createUserButtonCustomMenuItems = (customMenuItems: CustomMenuItem[], clerk: LoadedClerk) => {
  return createCustomMenuItems({ customMenuItems, getDefaultMenuItems: getUserButtonDefaultMenuItems }, clerk);
};

export const createOrganizationSwitcherCustomMenuItems = (customMenuItems: CustomMenuItem[], clerk: LoadedClerk) => {
  return createCustomMenuItems(
    { customMenuItems, getDefaultMenuItems: getOrganizationSwitcherDefaultMenuItems },
    clerk,
  );
};

const createCustomMenuItems = (
  { customMenuItems, getDefaultMenuItems }: CreateCustomMenuItemsParams,
  clerk: LoadedClerk,
) => {
  const { INITIAL_MENU_ITEMS, validReorderItemLabels } = getDefaultMenuItems();

  if (isDevelopmentSDK(clerk)) {
    checkForDuplicateUsageOfReorderingItems(customMenuItems, validReorderItemLabels);
  }

  const { menuItems } = getMenuItems({ customMenuItems, defaultMenuItems: INITIAL_MENU_ITEMS });

  return menuItems;
};

const getMenuItems = ({
  customMenuItems,
  defaultMenuItems,
}: {
  customMenuItems: CustomMenuItem[];
  defaultMenuItems: MenuItem[];
}) => {
  let remainingDefaultItems: MenuItem[] = defaultMenuItems.map(r => r);

  const items: MenuItem[] = customMenuItems.map((ci: CustomMenuItem, index) => {
    if (isCustomMenuLink(ci)) {
      return {
        name: ci.label,
        id: `custom-menutItem-${index}`,
        icon: props => (
          <ExternalElementMounter
            mount={ci.mountIcon}
            unmount={ci.unmountIcon}
            {...props}
          />
        ),
        path: sanitizeCustomLinkURL(ci.href),
        external: true,
      };
    }

    if (isCustomMenuItem(ci)) {
      return {
        name: ci.label,
        id: `custom-menutItem-${index}`,
        icon: props => (
          <ExternalElementMounter
            mount={ci.mountIcon}
            unmount={ci.unmountIcon}
            {...props}
          />
        ),
        onClick: ci?.onClick,
      };
    }

    const reorderItem = defaultMenuItems.find(item => item.id === ci.label) as MenuItem;
    remainingDefaultItems = remainingDefaultItems.filter(item => item.id !== ci.label);

    return { ...reorderItem };
  });

  const allItems = [...items, ...remainingDefaultItems];

  const hasReorderedManageAccountOrCreateOrg = customMenuItems.some(
    item =>
      item.label === USER_BUTTON_ITEM_ID.MANAGE_ACCOUNT ||
      item.label === ORGANIZATION_SWITCHER_ITEM_ID.CREATE_ORGANIZATION,
  );
  // Ensure that the "Manage account" and "Create organization" item is always at the top of the list if it's not included in the custom items
  if (!hasReorderedManageAccountOrCreateOrg) {
    allItems.sort((a, b) => {
      if (a.id === USER_BUTTON_ITEM_ID.MANAGE_ACCOUNT || a.id === ORGANIZATION_SWITCHER_ITEM_ID.CREATE_ORGANIZATION) {
        return -1;
      }
      if (b.id === USER_BUTTON_ITEM_ID.MANAGE_ACCOUNT || b.id === ORGANIZATION_SWITCHER_ITEM_ID.CREATE_ORGANIZATION) {
        return 1;
      }
      return 0;
    });
  }

  return { menuItems: allItems };
};

const getUserButtonDefaultMenuItems = () => {
  const INITIAL_MENU_ITEMS = [
    {
      name: localizationKeys('userButton.action__manageAccount'),
      id: USER_BUTTON_ITEM_ID.MANAGE_ACCOUNT as 'manageAccount',
      icon: CogFilled as React.ComponentType,
    },
    {
      name: localizationKeys('userButton.action__signOut'),
      id: USER_BUTTON_ITEM_ID.SIGN_OUT as 'signOut',
      icon: SignOut as React.ComponentType,
    },
  ];

  const validReorderItemLabels: string[] = INITIAL_MENU_ITEMS.map(r => r.id);

  return { INITIAL_MENU_ITEMS, validReorderItemLabels };
};

const getOrganizationSwitcherDefaultMenuItems = () => {
  const INITIAL_MENU_ITEMS = [
    {
      name: localizationKeys('organizationSwitcher.action__createOrganization'),
      id: ORGANIZATION_SWITCHER_ITEM_ID.CREATE_ORGANIZATION,
      icon: Add,
    },
  ];

  const validReorderItemLabels: string[] = INITIAL_MENU_ITEMS.map(r => r.id);

  return { INITIAL_MENU_ITEMS, validReorderItemLabels };
};

const isCustomMenuItem = (ci: CustomMenuItem): ci is CustomMenuAction => {
  return !!ci.label && !!ci.onClick && !ci.mount && !ci.unmount && !!ci.mountIcon && !!ci.unmountIcon;
};

const isCustomMenuLink = (ci: CustomMenuItem): ci is CustomMenuLink => {
  return !!ci.href && !!ci.label && !ci.mount && !ci.unmount && !!ci.mountIcon && !!ci.unmountIcon;
};

const isReorderItem = (ci: CustomMenuItem, validItems: string[]): ci is MenuReorderItem => {
  return !ci.mount && !ci.unmount && !ci.mountIcon && !ci.unmountIcon && validItems.some(v => v === ci.label);
};

const checkForDuplicateUsageOfReorderingItems = (customMenuItems: CustomMenuItem[], validReorderItems: string[]) => {
  const reorderItems = customMenuItems.filter(ci => isReorderItem(ci, validReorderItems));
  reorderItems.reduce((acc, ci) => {
    if (acc.includes(ci.label)) {
      console.error(
        `Clerk: The "${ci.label}" item is used more than once when reordering pages. This may cause unexpected behavior.`,
      );
    }
    return [...acc, ci.label];
  }, [] as string[]);
};

const sanitizeCustomLinkURL = (url: string): string => {
  if (!url) {
    throw new Error('Clerk: URL is required for custom links');
  }
  if (isValidUrl(url)) {
    return url;
  }
  return (url as string).charAt(0) === '/' ? url : `/${url}`;
};
