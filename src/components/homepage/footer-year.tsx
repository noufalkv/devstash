"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getYear = () => new Date().getFullYear();
const getServerYear = () => null;

/** The current year, read in the browser so the page can still be prerendered. */
export function FooterYear() {
  const year = useSyncExternalStore(subscribe, getYear, getServerYear);
  return <>{year}</>;
}
