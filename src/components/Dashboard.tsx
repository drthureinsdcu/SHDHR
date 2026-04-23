import React from 'react';
import { Building2, UserCheck, UsersRound, TriangleAlert, FileText } from 'lucide-react';

export default function Dashboard({ state }: { state: ReturnType<typeof import('../useAppState').useAppState> }) {
  const { facilities, staffEntries } = state;

  let overQuotaCount = 0;
  let attachedCount = 0;

  facilities.forEach(f => {
    (f.customQuotas || []).forEach(q => {
      const occupied = staffEntries.filter(s => s.facilityId === f.id && s.position === q.position).length;
      if (q.max > 0 && occupied > q.max) overQuotaCount++;
    });
  });

  staffEntries.forEach(s => {
    if (s.facilityId !== s.currentFacilityId || s.dutyStatus === "Attached") attachedCount++;
  });

  const attachedStaff = staffEntries.filter(s => s.facilityId !== s.currentFacilityId || s.dutyStatus === "Attached");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">အကျဉ်းချုပ်</h2>
        <p className="text-slate-500 text-sm mt-1">စနစ်တစ်ခုလုံး၏ အကျဉ်းချုပ် အချက်အလက်များ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">စုစုပေါင်း ဌာနများ</p>
          <h3 className="text-3xl font-bold text-slate-800">{facilities.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
            <UserCheck className="w-5 h-5" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">လက်ရှိ ဝန်ထမ်းများ</p>
          <h3 className="text-3xl font-bold text-slate-800">{staffEntries.length}</h3>
        </div>
        <div className="bg-amber-50/30 p-6 rounded-2xl border border-amber-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
            <UsersRound className="w-5 h-5" />
          </div>
          <p className="text-slate-600 text-sm font-medium mb-1">တွဲဖက်တာဝန်ထမ်းများ</p>
          <h3 className="text-3xl font-bold text-amber-600">{attachedCount}</h3>
        </div>
        <div className="bg-red-50/20 p-6 rounded-2xl border border-red-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
            <TriangleAlert className="w-5 h-5" />
          </div>
          <p className="text-slate-600 text-[13px] font-medium mb-1">သတ်မှတ်ချက်ကျော်လွန်မှု</p>
          <h3 className="text-3xl font-bold text-red-600">{overQuotaCount}</h3>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">တွဲဖက်တာဝန်ထမ်းများ (Attached Staff)</h3>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">ရာထူး</th>
                <th className="px-6 py-4">မူလဌာန (Source)</th>
                <th className="px-6 py-4">လက်ရှိတာဝန်ကျဌာန (Dest)</th>
                <th className="px-6 py-4">အကြောင်းပြချက်</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {attachedStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-slate-400 text-sm">တွဲဖက်တာဝန်ထမ်းများ မရှိသေးပါ။</td>
                </tr>
              ) : (
                attachedStaff.map(s => {
                  const getFacility = (id: number, ext: string = '') => facilities.find(f => f.id === id) || { name: ext || 'ပြင်ပ', type: '' };
                  const homeFac = getFacility(s.facilityId, s.externalFacilityName);
                  const currFac = getFacility(s.currentFacilityId);
                  
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4"><span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-[11px] font-semibold">{s.position}</span></td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{homeFac.name}</td>
                      <td className="px-6 py-4 text-blue-600 font-semibold">{currFac.name}</td>
                      <td className="px-6 py-4 text-slate-500 truncate max-w-[150px] text-xs">{s.reason}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
