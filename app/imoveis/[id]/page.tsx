import { PublicMarketplace } from '@/app/page';

type ImovelDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ImovelDetailsPage({
  params,
}: ImovelDetailsPageProps) {
  const { id } = await params;

  return <PublicMarketplace initialView="details" initialPropertyId={id} />;
}
