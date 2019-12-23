import { Ntp, NtpPacket, NtpServer } from 'ntp2';

{
  const client: Ntp = new Ntp();
  client.time((err: Error | null, packet: NtpPacket): void  => {});

  const buffer = new Buffer(new Array(48).fill(0));
  const res: NtpPacket = Ntp.parse(buffer);
}

{
  const server: NtpServer = Ntp.createServer();
}
