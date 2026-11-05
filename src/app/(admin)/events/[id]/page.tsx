import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { countEventOrders, loadEventBasics } from "../event.data";
import { BasicsForm } from "../_components/BasicsForm";

export default async function EventBasicsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const [event, orders] = await Promise.all([
    loadEventBasics(db, id.data),
    countEventOrders(db, id.data),
  ]);
  if (!event) notFound();
  return <BasicsForm id={id.data} event={event} orders={orders} />;
}
