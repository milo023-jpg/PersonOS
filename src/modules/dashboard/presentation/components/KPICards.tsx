export default function KPICards() {
    return (
        <section className="bg-surface p-4 lg:p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-text-primary">Today's Metrics</h2>
                <span className="text-xs font-medium bg-gray-100 text-text-secondary px-2 py-1 rounded-md">System Summary</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-pastel-red rounded-xl p-4 border border-red-50 dark:border-transparent">
                    <div className="flex items-start justify-between mb-1">
                        <h3 className="text-2xl font-bold text-text-primary leading-none">$1k</h3>
                        <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                    </div>
                    <p className="text-[13px] font-semibold text-text-secondary">Total Revenue</p>
                    <p className="text-[10px] text-green-600 font-medium mt-2">+8% vs yesterday</p>
                </div>

                <div className="bg-pastel-orange rounded-xl p-4 border border-orange-50 dark:border-transparent">
                    <div className="flex items-start justify-between mb-1">
                        <h3 className="text-2xl font-bold text-text-primary leading-none">300</h3>
                        <div className="w-8 h-8 rounded-full bg-orange-400 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                        </div>
                    </div>
                    <p className="text-[13px] font-semibold text-text-secondary">Tasks Completed</p>
                    <p className="text-[10px] text-green-600 font-medium mt-2">+5% vs yesterday</p>
                </div>

                <div className="bg-pastel-green rounded-xl p-4 border border-green-50 dark:border-transparent">
                    <div className="flex items-start justify-between mb-1">
                        <h3 className="text-2xl font-bold text-text-primary leading-none">5</h3>
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                    </div>
                    <p className="text-[13px] font-semibold text-text-secondary">Active Projects</p>
                    <p className="text-[10px] text-green-600 font-medium mt-2">+1.2% vs yesterday</p>
                </div>

                <div className="bg-pastel-purple rounded-xl p-4 border border-purple-50 dark:border-transparent">
                    <div className="flex items-start justify-between mb-1">
                        <h3 className="text-2xl font-bold text-text-primary leading-none">8</h3>
                        <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        </div>
                    </div>
                    <p className="text-[13px] font-semibold text-text-secondary">New Ideas</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-2">No change</p>
                </div>
            </div>
        </section>
    )
}
