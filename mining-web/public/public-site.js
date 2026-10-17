(() => {
  const site = document.body.dataset.publicSite;
  if (site !== "mining" && site !== "staking") return;
  const title = document.querySelector("head title");
  const description = document.querySelector('meta[name="description"]');
  const heroTitle = document.querySelector(".hero-copy h2");
  const heroCopy = document.querySelector(".hero-copy p");
  const heroButtons = document.querySelector(".hero-buttons");
  const brand = document.querySelector(".brand");

  if (site === "mining") {
    if (title) title.textContent = "AETHER ATH Mining — Official Mining Portal";
    if (description) description.content = "Official AETHER ATH Mining portal for mining power, boosters, rewards, referrals and vesting.";
    if (heroTitle) heroTitle.textContent = "Mine. Earn. Grow with AETHER.";
    if (heroCopy) heroCopy.textContent = "Enter the dedicated AETHER ATH Mining portal to manage mining power, boosters, daily rewards, referrals and vesting.";
    if (brand) brand.setAttribute("aria-label", "AETHER ATH Mining");
  } else {
    if (title) title.textContent = "AETHER ATH Staking — Official Staking Portal";
    if (description) description.content = "Official AETHER ATH Staking portal for staking positions, rewards, referrals, network ranks, Lifestyle Bonus and rank salary.";
    if (heroTitle) heroTitle.textContent = "Stake. Build. Grow Together.";
    if (heroCopy) heroCopy.textContent = "Use the dedicated AETHER ATH Staking portal to manage stake positions, daily rewards, direct referrals, network ranks, Lifestyle Bonus and rank salary.";
    if (brand) brand.setAttribute("aria-label", "AETHER ATH Staking");
    if (heroButtons) heroButtons.innerHTML = '<a class="btn btn-gold btn-large" href="#staking">Open Staking Dashboard →</a><a class="btn btn-dark btn-large" href="#docs">Read Protocol Notes</a>';
  }
})();