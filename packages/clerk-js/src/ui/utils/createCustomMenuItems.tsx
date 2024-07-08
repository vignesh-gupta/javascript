import type { CustomMenuItem, LoadedClerk } from '@clerk/types';

import { isValidUrl } from '../../utils';
import { USER_BUTTON_ITEM_ID } from '../constants';
import type { LocalizationKey } from '../customizables';
import { CogFilled, SignOut } from '../icons';
import { localizationKeys } from '../localization';
import { ExternalElementMounter } from './ExternalElementMounter';
import { isDevelopmentSDK } from './runtimeEnvironment';

export type MenuItem = {
  name: LocalizationKey | string;
  id: string;
  icon: React.ComponentType;
  onClick?: () => void;
} & ({ external: true; path: string } | { external?: false; path?: string });

type UserButtonReorderItem = {
  label: 'manageAccount' | 'signOut';
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

export const createUserButtonCustomMenuItems = (customMenuItems: CustomMenuItem[], clerk: LoadedClerk) => {
  return createCustomMenuItems({ customMenuItems }, clerk);
};

const createCustomMenuItems = ({ customMenuItems }: { customMenuItems: CustomMenuItem[] }, clerk: LoadedClerk) => {
  const { INITIAL_MENU_ITEMS, validReorderItemLabels } = getUserButtonDefaultMenuItems();

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

  const hasCustomManageAccount = customMenuItems.some(item => item.label === USER_BUTTON_ITEM_ID.MANAGE_ACCOUNT);
  // Ensure that the "Manage Account" item is always at the top of the list if it's not included in the custom items
  if (!hasCustomManageAccount) {
    allItems.sort((a, b) => {
      if (a.id === 'manageAccount') {
        return -1;
      }
      if (b.id === 'manageAccount') {
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
      id: USER_BUTTON_ITEM_ID.MANAGE_ACCOUNT,
      icon: CogFilled,
    },
    {
      name: localizationKeys('userButton.action__signOut'),
      id: USER_BUTTON_ITEM_ID.SIGN_OUT,
      icon: SignOut,
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

const isReorderItem = (ci: CustomMenuItem, validItems: string[]): ci is UserButtonReorderItem => {
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
