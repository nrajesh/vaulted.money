import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  NAV_GROUPS,
  isNavItemActive,
  isNavItemVisible,
  type NavEnvironment,
  type NavGroup,
  type NavItem,
} from "./navConfig";

const NavItemRow = ({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) => {
  const { t } = useTranslation();
  const Icon = item.icon;
  const label = t(item.labelKey, { defaultValue: item.defaultLabel });
  const isActive = isNavItemActive(item, pathname);

  if (item.children?.length) {
    return (
      <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton isActive={isActive} tooltip={label}>
              <Icon />
              <span>{label}</span>
              <ChevronDown
                aria-hidden="true"
                className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180"
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => {
                const childActive = isNavItemActive(child, pathname);
                return (
                  <SidebarMenuSubItem key={child.id}>
                    <SidebarMenuSubButton asChild isActive={childActive}>
                      <Link
                        to={child.to!}
                        aria-current={childActive ? "page" : undefined}
                      >
                        <span>
                          {t(child.labelKey, {
                            defaultValue: child.defaultLabel,
                          })}
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link to={item.to!} aria-current={isActive ? "page" : undefined}>
          <Icon />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const NavGroupSection = ({
  group,
  items,
  pathname,
}: {
  group: NavGroup;
  items: NavItem[];
  pathname: string;
}) => {
  const { t } = useTranslation();
  const { state, isMobile, isHovered } = useSidebar();
  const label = t(group.labelKey, { defaultValue: group.defaultLabel });
  const containsCurrentPage = items.some((item) =>
    isNavItemActive(item, pathname),
  );
  const [isOpen, setIsOpen] = React.useState(containsCurrentPage);

  // Navigating into a folded group (e.g. from a link elsewhere) unfolds it,
  // so the highlighted item is always visible.
  React.useEffect(() => {
    if (containsCurrentPage) setIsOpen(true);
  }, [containsCurrentPage]);

  const menu = (
    <SidebarMenu>
      {items.map((item) => (
        <NavItemRow key={item.id} item={item} pathname={pathname} />
      ))}
    </SidebarMenu>
  );

  // In the icon-only desktop rail (collapsed and not hovered) the group label
  // is hidden, so a folded group would be unreachable: show its icons instead.
  const isIconRail = state === "collapsed" && !isHovered && !isMobile;

  if (!group.collapsible || isIconRail) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        {menu}
      </SidebarGroup>
    );
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible"
    >
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="flex w-full min-h-8 items-center">
            {label}
            <ChevronDown
              aria-hidden="true"
              className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180"
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>{menu}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
};

/**
 * The sidebar's page links, rendered from `NAV_GROUPS`. Must be rendered
 * inside `SidebarProvider` and a router.
 */
export const AppSidebarNav = ({ env }: { env: NavEnvironment }) => {
  const { pathname } = useLocation();
  return (
    <>
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => isNavItemVisible(item, env));
        if (items.length === 0) return null;
        return (
          <NavGroupSection
            key={group.id}
            group={group}
            items={items}
            pathname={pathname}
          />
        );
      })}
    </>
  );
};
