import Gc2DeviceDetail from "@/components/devices/gc2-device-detail";

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ deviceId: string }>;
}) {
  const { deviceId } = await params;
  return <Gc2DeviceDetail deviceId={deviceId} />;
}
