"use client";

/**
 * NavList — adapted from @untitledui/react base-components/nav-list.tsx
 *
 * Uses native <details>/<summary> for collapsible items (same as @untitledui/react).
 * Semantic token classes from the Untitled UI theme.
 */

import { cx } from "@/utils/cx";
import type { NavItemDividerType, NavItemType } from "./config";
import { NavItemBase } from "./nav-item";

interface NavListProps {
    activeUrl?: string;
    className?: string;
    items: (NavItemType | NavItemDividerType)[];
}

export const NavList = ({ activeUrl, items, className }: NavListProps) => {
    const isActive = (item: NavItemType) =>
        item.href === activeUrl || item.items?.some((sub) => sub.href === activeUrl);

    return (
        <ul className={cx("flex flex-col px-4 pt-5", className)}>
            {items.map((item, index) => {
                if (item.divider) {
                    return (
                        <li key={index} className="w-full px-0.5 py-2">
                            <hr className="h-px w-full border-none bg-border-secondary" />
                        </li>
                    );
                }

                if (item.items?.length) {
                    return (
                        <details
                            key={item.label}
                            open={isActive(item) || undefined}
                            className="appearance-none py-0.25"
                        >
                            <NavItemBase
                                href={item.href}
                                badge={item.badge}
                                icon={item.icon}
                                type="collapsible"
                                current={isActive(item)}
                            >
                                {item.label}
                            </NavItemBase>

                            <dd>
                                <ul className="pb-1">
                                    {item.items.map((childItem) => (
                                        <li key={childItem.label} className="py-0.25">
                                            <NavItemBase
                                                href={childItem.href}
                                                badge={childItem.badge}
                                                icon={childItem.icon}
                                                type="collapsible-child"
                                                current={activeUrl === childItem.href}
                                            >
                                                {childItem.label}
                                            </NavItemBase>
                                        </li>
                                    ))}
                                </ul>
                            </dd>
                        </details>
                    );
                }

                return (
                    <li key={item.label} className="py-px">
                        <NavItemBase
                            type="link"
                            badge={item.badge}
                            icon={item.icon}
                            href={item.href}
                            current={isActive(item)}
                        >
                            {item.label}
                        </NavItemBase>
                    </li>
                );
            })}
        </ul>
    );
};
