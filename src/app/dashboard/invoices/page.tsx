import { lusitana } from "@/ui/fonts";
import Search from "@/ui/search";
import { CreateInvoice } from "@/ui/invoices/buttons";
import { Suspense } from "react";
import Table from '@/ui/invoices/table';
import { InvoicesTableSkeleton } from '@/ui/skeletons';
import Pagination from "@/ui/invoices/pagination";
import { fetchInvoicesPages } from "@/lib/data";

const Page = async(props: {
    searchParams?: Promise<{
      query?: string;
      page?: string;
    }>;
  }) => {

    const searchParams = await props.searchParams;
    const query = searchParams?.query ? searchParams.query : '';
    const currentPage = Number(searchParams?.page)
    const totalPages = await fetchInvoicesPages(query);

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <Search placeholder="Search invoices..." />
                <CreateInvoice />
            </div>
             <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
                <Table query={query} currentPage={currentPage} />
            </Suspense>
            <div className="mt-5 flex w-full justify-center">
            <Pagination totalPages={totalPages} />
            </div>
        </div>

    )
}

export default Page;