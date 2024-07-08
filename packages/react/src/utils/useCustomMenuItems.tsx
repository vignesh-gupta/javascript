import type { CustomMenuItem } from '@clerk/types';
import type { ReactElement } from 'react';
import React from 'react';

import { MenuAction, MenuItems, MenuLink, UserProfileLink, UserProfilePage } from '../components/uiComponents';
import type { UserButtonActionProps, UserButtonLinkProps } from '../types';
import type { UseCustomElementPortalParams, UseCustomElementPortalReturn } from './useCustomElementPortal';
import { useCustomElementPortal } from './useCustomElementPortal';

const isThatComponent = (v: any, component: React.ReactNode): v is React.ReactNode => {
  return !!v && React.isValidElement(v) && (v as React.ReactElement)?.type === component;
};

export const useUserButtonCustomMenuItems = (children: React.ReactNode | React.ReactNode[]) => {
  const reorderItemsLabels = ['manageAccount', 'signOut'];
  return useCustomMenuItems({
    children,
    reorderItemsLabels,
    MenuItemsComponent: MenuItems,
    MenuActionComponent: MenuAction,
    MenuLinkComponent: MenuLink,
    componentName: 'UserButton',
  });
};

type UseCustomMenuItemsParams = {
  children: React.ReactNode | React.ReactNode[];
  MenuItemsComponent?: any;
  MenuActionComponent?: any;
  MenuLinkComponent?: any;
  componentName: string;
  reorderItemsLabels: string[];
};

type CustomMenuItemType = UserButtonActionProps | UserButtonLinkProps;

const useCustomMenuItems = ({
  children,
  MenuItemsComponent,
  MenuActionComponent,
  MenuLinkComponent,
  reorderItemsLabels,
}: UseCustomMenuItemsParams) => {
  const validChildren: CustomMenuItemType[] = [];
  const customMenuItems: CustomMenuItem[] = [];
  const customMenuItemsPortals: React.ComponentType[] = [];

  React.Children.forEach(children, child => {
    if (
      !isThatComponent(child, MenuItemsComponent) &&
      !isThatComponent(child, MenuLinkComponent) &&
      !isThatComponent(child, typeof UserProfileLink) &&
      !isThatComponent(child, typeof UserProfilePage)
    ) {
      if (child) {
        // logErrorInDevMode(customMenuItemsIgnoredComponent(componentName));
      }
      return;
    }

    // Menu items children
    const { props } = child as ReactElement;

    React.Children.forEach(props.children, child => {
      if (!isThatComponent(child, MenuActionComponent) && !isThatComponent(child, MenuLinkComponent)) {
        if (child) {
          // logErrorInDevMode(customMenuItemsIgnoredComponent(componentName));
        }

        return;
      }

      const { props } = child as ReactElement;

      const { label, labelIcon, href, onClick } = props;

      if (isThatComponent(child, MenuActionComponent)) {
        if (isReorderItem(props, reorderItemsLabels)) {
          // This is a reordering item
          validChildren.push({ label });
        } else if (isCustomMenuItem(props)) {
          validChildren.push({ label, labelIcon, onClick });
        } else {
          // TODO: logErrorInDevMode
          return;
        }
      }

      if (isThatComponent(child, MenuLinkComponent)) {
        if (isExternalLink(props)) {
          validChildren.push({ label, labelIcon, href });
        } else {
          // TODO: logErrorInDevMode
          return;
        }
      }
    });
  });

  const customMenuItemLabelIcons: UseCustomElementPortalParams[] = [];
  const customLinkLabelIcons: UseCustomElementPortalParams[] = [];
  validChildren.forEach((mi, index) => {
    if (isCustomMenuItem(mi)) {
      customMenuItemLabelIcons.push({ component: mi.labelIcon, id: index });
    }
    if (isExternalLink(mi)) {
      customLinkLabelIcons.push({ component: mi.labelIcon, id: index });
    }
  });

  const customMenuItemLabelIconsPortals = useCustomElementPortal(customMenuItemLabelIcons);
  const customLinkLabelIconsPortals = useCustomElementPortal(customLinkLabelIcons);
  validChildren.forEach((mi, index) => {
    if (isReorderItem(mi, reorderItemsLabels)) {
      customMenuItems.push({
        label: mi.label,
      });
    }
    if (isCustomMenuItem(mi)) {
      const {
        portal: iconPortal,
        mount: mountIcon,
        unmount: unmountIcon,
      } = customMenuItemLabelIconsPortals.find(p => p.id === index) as UseCustomElementPortalReturn;
      customMenuItems.push({
        label: mi.label,
        onClick: mi.onClick,
        mountIcon,
        unmountIcon,
      });
      customMenuItemsPortals.push(iconPortal);
    }
    if (isExternalLink(mi)) {
      const {
        portal: iconPortal,
        mount: mountIcon,
        unmount: unmountIcon,
      } = customLinkLabelIconsPortals.find(p => p.id === index) as UseCustomElementPortalReturn;
      customMenuItems.push({
        label: mi.label,
        href: mi.href,
        mountIcon,
        unmountIcon,
      });
      customMenuItemsPortals.push(iconPortal);
    }
  });

  return { customMenuItems, customMenuItemsPortals };
};

const isReorderItem = (childProps: any, validItems: string[]): boolean => {
  const { children, label, onClick, labelIcon } = childProps;
  return !children && !onClick && !labelIcon && validItems.some(v => v === label);
};

const isCustomMenuItem = (childProps: any): childProps is UserButtonActionProps => {
  const { label, labelIcon, onClick } = childProps;
  return !!labelIcon && !!label && typeof onClick === 'function';
};

const isExternalLink = (childProps: any): childProps is UserButtonLinkProps => {
  const { label, href, labelIcon } = childProps;
  return !!href && !!labelIcon && !!label;
};
