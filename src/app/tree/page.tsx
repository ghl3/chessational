"use client";

import Home from "../page";

const TreePage = ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  return <Home params={params} searchParams={searchParams} initialTab="TREE" />;
};

export default TreePage;
