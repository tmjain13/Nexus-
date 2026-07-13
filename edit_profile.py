filepath = 'src/pages/Profile.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Find start and end indices of the old premium membership block
start_str = "activeSetting === 'premium_membership' ? ("
end_str = ") : activeSetting === 'starred' ? ("

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    line_start_idx = content.rfind('\n', 0, start_idx) + 1
    leading_spaces = content[line_start_idx:start_idx]
    
    replacement = """activeSetting === 'premium_membership' ? (
                                <div className="p-6 bg-gradient-to-br from-[#1c1917] to-[#0c0a09] border border-amber-500/20 rounded-3xl shadow-2xl space-y-6 text-left text-white relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <Crown size={180} className="text-amber-500 animate-pulse" />
                                  </div>
                                  
                                  <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-3">
                                      <div className="p-3 bg-amber-500 rounded-2xl text-zinc-950 shadow-md shadow-amber-500/25">
                                        <Crown size={20} className="scale-110" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-black font-mono tracking-widest text-amber-500 uppercase">ENCLAVE PREMIUM</h4>
                                        <p className="text-[10px] text-zinc-400 font-medium">Subscription Protocols</p>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => setActiveSetting(null)} 
                                      className="p-1 px-3 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-xl text-[10px] font-mono uppercase font-bold hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-2"
                                      style={{ border: 'none' }}
                                    >
                                      <ArrowLeft size={10} /> Back
                                    </button>
                                  </div>

                                  {/* Subscription Status Card */}
                                  <div className="p-5 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-inner relative z-10 space-y-4">
                                    {isPremium ? (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                          <div>
                                            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-500">Tier Status</span>
                                            <h5 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                                              ★ Premium Protocol Active <PremiumBadge size="md" />
                                            </h5>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">Plan</span>
                                            <p className="text-xs font-bold text-white capitalize mt-0.5">{subscription?.plan || 'monthly'}</p>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-left">
                                          <div>
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Started On</span>
                                            <p className="text-xs font-bold mt-0.5">
                                              {subscription?.startedAt ? new Date(subscription.startedAt.seconds * 1000).toLocaleDateString() : 'Active'}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Renew/Expiry</span>
                                            <p className="text-xs font-bold mt-0.5">
                                              {subscription?.expiresAt ? new Date(subscription.expiresAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            </p>
                                          </div>
                                        </div>

                                        {daysLeft !== null && (
                                          <div className="bg-amber-500/10 text-amber-500 text-[10px] font-mono font-bold uppercase tracking-widest p-2 rounded-xl text-center border border-amber-500/20">
                                            ⌛ {daysLeft} Days remaining in premium trial
                                          </div>
                                        )}

                                        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-4">
                                          <button
                                            onClick={async () => {
                                              if (window.confirm("Are you sure you want to cancel your Premium benefits?")) {
                                                await cancel();
                                                alert("Subscription set to cancel.");
                                              }
                                            }}
                                            className="text-[9px] font-mono text-zinc-400 hover:text-red-400 underline uppercase cursor-pointer"
                                            style={{ background: 'none', border: 'none' }}
                                          >
                                            Downgrade (Sandbox sandbox)
                                          </button>
                                          <span className="text-[9px] font-mono text-green-500 uppercase font-black">
                                            ✓ AUTO RENEW ACTIVE
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-4 text-center">
                                        <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto font-medium">
                                          Your current tier is <strong>Free</strong>. Unlock 12 premium protocols, custom themes, PNG app icons, custom notifications, and up to 10 pinned chats.
                                        </p>
                                        
                                        {daysLeft !== null && daysLeft <= 0 && (
                                          <div className="p-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider">
                                            ⌛ Free Trial expired. Upgrade to restore access.
                                          </div>
                                        )}

                                        <button
                                          onClick={() => setShowVaultPinPrompt(true)} // Toggles upsell modal by using showVaultPinPrompt or adding a dedicated modal state inside Profile.tsx!
                                          className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-2xl text-[10px] font-mono uppercase tracking-[0.15em] shadow-lg shadow-amber-500/10 transition-all active:scale-95 cursor-pointer w-full max-w-xs block mx-auto border border-amber-500"
                                          style={{ border: 'none' }}
                                        >
                                          Activate Premium — ₹79/mo
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Feature highlights */}
                                  <div className="space-y-3 relative z-10">
                                    <h5 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                                      <Sparkles size={11} /> Exclusive Entitlements
                                    </h5>
                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                      {[
                                        { title: "20+ Customized Themes", desc: "Select from exclusive preset themes or build custom palette variables." },
                                        { title: "Custom Favicon & Icon Uploads", desc: "Change launcher logo, browser tab titles, and upload customized PNGs." },
                                        { title: "15 Custom Audio Ringtones", desc: "Access 15 soundscapes in alerts or upload custom MP3s up to 5MB." },
                                        { title: "Exclusive Animated Stickers", desc: "Send Pepe Memes, Space Cadet elements, and Crypto-themed reactions." },
                                        { title: "Upgraded Chat List & Folders", desc: "Filter contacts using Work, Groups, or Favorites folders, and pin 10 chats." }
                                      ].map((item, i) => (
                                        <div key={i} className="p-4 bg-zinc-900/50 border border-zinc-850/60 rounded-2xl flex items-start gap-3">
                                          <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-xl shrink-0 mt-0.5">
                                            <Crown size={12} />
                                          </div>
                                          <div>
                                            <h6 className="text-xs font-bold text-white">{item.title}</h6>
                                            <p className="text-[10px] text-zinc-400 leading-normal mt-1">{item.desc}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                            """
    
    new_content = content[:line_start_idx + len(leading_spaces)] + replacement + content[end_idx:]
    with open(filepath, 'w') as f:
        f.write(new_content)
    print("Success")
else:
    print(f"Indices not found: start={start_idx}, end={end_idx}")
