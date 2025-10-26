"use client";

import { NAV_ITEMS } from "@/lib/constants";
import SearchCommand from "@/SearchCommand";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const NavItems = ({
  initialStocks,
}: {
  initialStocks: StockWithWatchlistStatus[];
}) => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";

    return pathname.startsWith(path);
  };
  return (
    <ul className="flex flex-col gap-3 p-2 font-medium sm:flex-row sm:gap-10">
      {NAV_ITEMS.map(({ href, label }) => {
        if (label === "Search")
          return (
            <li key="search-trigger">
              <SearchCommand
                renderAs="text"
                label="Search"
                initialStocks={initialStocks}
              />
            </li>
          );
        return (
          <li key={href}>
            <Link
              href={href}
              className={`transition-colors hover:text-yellow-500 ${
                isActive(href) ? "text-gray-100" : ""
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default NavItems;
