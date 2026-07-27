import Gc2DeviceDetailRoute from "@/components/devices/gc2-device-detail-route";

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ deviceId: string }>;
}) {
  const { deviceId } = await params;
  return <Gc2DeviceDetailRoute deviceId={deviceId} />;
}
