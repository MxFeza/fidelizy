"use client";

import type { FC, HTMLAttributes, MouseEventHandler, ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "@untitledui/icons";
import { cx, sortCx } from "@/utils/cx";

/**
 * NavItemBase — adapted from @untitledui/react base-components/nav-item.tsx
 *
 * Uses IDENTICAL semantic token classes from the Untitled UI theme.
 * Only difference: Next.js Link instead of react-aria-components AriaLink,
 * and brand-solid active state (Izou design) instead of bg-secondary.
 */

const styles = sortCx({
    root: "group/item relative flex max-h-9 w-full cursor-pointer items-center rounded-md bg-primary outline-focus-ring transition duration-100 ease-linear select-none hover:bg-primary_hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
    rootSelected: "bg-brand-solid hover:bg-brand-solid_hover",
    rootChildSelected: "bg-brand-secondary hover:bg-brand-secondary",
});

interface NavItemBaseProps {
    open?: boolean;
    href?: string;
    type: "link" | "collapsible" | "collapsible-child";
    icon?: FC<HTMLAttributes<HTMLOrSVGElement>>;
    badge?: ReactNode;
    current?: boolean;
    onClick?: MouseEventHandler;
    children?: ReactNode;
}

export const NavItemBase = ({ current, type, badge, href, icon: Icon, children, onClick }: NavItemBaseProps) => {
    const isParent = type !== "collapsible-child";

    const iconElement = Icon && (
        <Icon
            aria-hidden="true"
            className={cx(
                "mr-2 size-5 shrink-0 text-fg-quaternary transition-inherit-all group-hover/item:text-fg-quaternary_hover",
                current && isParent && "text-white",
                current && !isParent && "text-fg-brand-primary",
            )}
        />
    );

    const badgeElement = badge && (
        <span className="ml-3 inline-flex items-center rounded-full bg-tertiary px-2.5 py-0.5 text-sm font-medium text-secondary">
            {badge}
        </span>
    );

    const labelElement = (
        <span
            className={cx(
                "flex-1 text-sm font-semibold text-secondary transition-inherit-all group-hover/item:text-secondary_hover",
                current && isParent && "text-white group-hover/item:text-white",
                current && !isParent && "text-brand-secondary group-hover/item:text-brand-secondary",
            )}
        >
            {children}
        </span>
    );

    if (type === "collapsible") {
        return (
            <summary
                className={cx("p-2", styles.root, current && styles.rootSelected)}
                onClick={onClick}
            >
                {iconElement}
                {labelElement}
                {badgeElement}
                <ChevronDown
                    aria-hidden="true"
                    className={cx(
                        "ml-3 size-4 shrink-0 stroke-[2.5px] text-fg-quaternary in-open:-scale-y-100",
                        current && "text-brand-200",
                    )}
                />
            </summary>
        );
    }

    if (type === "collapsible-child") {
        return (
            <Link
                href={href ?? "#"}
                className={cx("py-2 pr-3 pl-10", styles.root, current && styles.rootChildSelected)}
                onClick={onClick}
                aria-current={current ? "page" : undefined}
            >
                {iconElement}
                {labelElement}
                {badgeElement}
            </Link>
        );
    }

    return (
        <Link
            href={href ?? "#"}
            className={cx("p-2", styles.root, current && styles.rootSelected)}
            onClick={onClick}
            aria-current={current ? "page" : undefined}
        >
            {iconElement}
            {labelElement}
            {badgeElement}
        </Link>
    );
};
