import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Tile from '../../components/ui/Tile';

function BankAccountDetails() {
  const selectedAccountNumber = sessionStorage.getItem(
    'selected_bsa_account_number'
  );

  const { data: accountDetails, isLoading } = useQuery({
    queryKey: ['accountDetails', selectedAccountNumber],
    queryFn: async () => {
      if (!selectedAccountNumber) return null;
      const res = await apiClient.post('/bsa/account-details', {
        account_number: selectedAccountNumber,
      });
      return res.data?.data?.account_details;
    },
    enabled: !!selectedAccountNumber,
  });

  if (isLoading) return null; // Or a skeleton/spinner
  if (!accountDetails) return null;

  const entries = Object.entries(accountDetails);

  const isOpening = (key: string) =>
    key.toLowerCase().includes('open') && key.toLowerCase().includes('bal');
  const isClosing = (key: string) =>
    key.toLowerCase().includes('clos') && key.toLowerCase().includes('bal');

  const normalTiles = entries.filter(
    ([key]) => !isOpening(key) && !isClosing(key)
  );
  const openingBalance = entries.find(([key]) => isOpening(key));
  const closingBalance = entries.find(([key]) => isClosing(key));

  return (
    <Card className="mx-auto shadow-sm border border-gray-300">
      <CardHeader>
        <CardTitle className="text-xl text-[#000080]/60">
          Account Details
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* First 8 tiles */}
        <div className="grid grid-cols-4 gap-4">
          {normalTiles.map(([key, value]) => (
            <Tile key={key} title={key} value={String(value)} />
          ))}
        </div>

        {/* Third row */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {openingBalance && (
            <Tile
              className="col-span-2"
              title={openingBalance[0]}
              value={String(openingBalance[1])}
            />
          )}

          {closingBalance && (
            <Tile
              className="col-span-2"
              title={closingBalance[0]}
              value={String(closingBalance[1])}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BankAccountDetails;
