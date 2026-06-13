'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

interface DeliveryTask {
  _id: string;
  order: {
    _id: string;
    uniqueCode: string;
    deliveryAddress: string;
    buildingName: string;
    totalAmount: number;
  } | string;
  earning: number;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

interface EarningData {
  tasks: DeliveryTask[];
  totalEarning: number;
  deliveryCount: number;
}

export default function DeliveryEarningsPage() {
  const [data, setData] = useState<EarningData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/delivery/earnings')
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('লোড ব্যর্থ হয়েছে'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">💵 আজকের আয়</h1>
      <p className="text-stone-500 mb-6">আজকের ডেলিভারি ও আয়ের হিসাব</p>

      {loading || !data ? (
        <p className="text-stone-500">লোড হচ্ছে...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-orange-600">{data.deliveryCount}</p>
              <p className="text-sm text-stone-500">ডেলিভারি</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-green-600">৳{data.totalEarning}</p>
              <p className="text-sm text-stone-500">মোট আয়</p>
            </div>
          </div>

          <h2 className="font-semibold text-stone-700 mb-3">আজকের ডেলিভারি তালিকা</h2>
          {data.tasks.length === 0 ? (
            <p className="text-stone-500">আজ এখনো কোনো ডেলিভারি হয়নি।</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm divide-y">
              {data.tasks.map((task) => {
                const order = typeof task.order === 'string' ? null : task.order;
                return (
                  <div key={task._id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-700">কোড: {order?.uniqueCode || '—'}</p>
                      <p className="text-sm text-stone-500">{order ? `${order.buildingName}, ${order.deliveryAddress}` : ''}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {task.deliveredAt
                          ? `ডেলিভার্ড: ${new Date(task.deliveredAt).toLocaleTimeString('bn-BD')}`
                          : `পিকআপ: ${new Date(task.createdAt).toLocaleTimeString('bn-BD')}`}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-green-600">৳{task.earning}</p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
