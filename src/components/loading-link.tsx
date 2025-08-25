
"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useLoading } from "@/context/loading-context";
import React, { useTransition } from "react";

type LoadingLinkProps = LinkProps & {
  children: React.ReactNode;
  className?: string;
};

export function LoadingLink({ children, ...props }: LoadingLinkProps) {
  const { showLoading } = useLoading();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    showLoading();
    startTransition(() => {
      router.push(props.href.toString());
    });
  };

  return (
    <a href={props.href.toString()} onClick={handleClick} className={props.className}>
      {children}
    </a>
  );
}
