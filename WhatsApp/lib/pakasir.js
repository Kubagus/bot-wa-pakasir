import axios from 'axios';

export async function createQris({ project, apiKey, orderId, amount }) {
  const url = 'https://app.pakasir.com/api/transactioncreate/qris';
  const body = {
    project,
    order_id: orderId,
    amount,
    api_key: apiKey
  };

  const res = await axios.post(url, body, { timeout: 15000 });

  if (!res.data || !res.data.payment) {
    throw new Error('Invalid response from Pakasir: ' + JSON.stringify(res.data));
  }

  return res.data.payment; // Object Payment { amount, total_payment, payment_number, expired_at, ... }
}

export async function transactionDetail({ project, apiKey, orderId, amount }) {
  const url = ' https://app.pakasir.com/api/transactiondetail';
  const res = await axios.get(url, {
    params: {
      project,
      amount,
      order_id: orderId,
      api_key: apiKey
    },
    timeout: 15000
  });

  return res.data.transaction; // cek status
}

// opsional
export async function simulatePayment({ project, apiKey, orderId, amount }) {
  const url = 'https://app.pakasir.com/api/paymentsimulation';
  const res = await axios.post(
    url,
    {
      project,
      order_id: orderId,
      amount,
      api_key: apiKey
    },
    { timeout: 15000 }
  );

  return res.data;
}