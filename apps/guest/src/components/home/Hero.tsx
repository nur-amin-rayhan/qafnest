"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { CitySelectDropdown } from "./hero/CitySelectDropdown";
import { PropertyTypeDropdown } from "./hero/PropertyTypeDropdown";
import { DateRangeDropdown } from "./hero/DateRangeDropdown";
import { GuestsCounterDropdown } from "./hero/GuestsCounterDropdown";
import { useHeroSearchForm } from "./hero/useHeroSearchForm";

export default function Hero() {
  const {
    t,
    language,
    selectedCity,
    setSelectedCity,
    selectedCategory,
    setSelectedCategory,
    checkinDate,
    checkoutDate,
    guestsCount,
    adults,
    setAdults,
    children,
    setChildren,
    rooms,
    setRooms,
    viewDate,
    setViewDate,
    activeDropdown,
    setActiveDropdown,
    containerRef,
    getTodayISO,
    dateRangeDisplay,
    handleDayClick,
    handleSearchSubmit,
    getCityLabel,
    getTypeLabel,
    activeCityName,
    activeTypeName,
  } = useHeroSearchForm();

  return (
    <section id="top" className="relative z-40 pt-20 sm:pt-22 lg:pt-24 pb-4 sm:pb-6 overflow-x-clip overflow-y-visible">
      {/* Background Ambience */}
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,100vw)] h-[300px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, rgba(168, 85, 247, 0.04) 50%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30 text-center">
        {/* Ministry Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 mb-3 sm:mb-3.5 border border-violet-200 dark:border-violet-500/20"
        >
          <span className="h-2 w-2 rounded-full bg-violet-600 dark:bg-fuchsia-400 animate-pulse" />
          {t.hero.badge}
        </motion.div>

        {/* Hero Title */}
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white max-w-3xl mx-auto leading-[1.22] sm:leading-[1.28] pb-2 sm:pb-3 mb-5 sm:mb-6">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block mr-2 rtl:ml-2 rtl:mr-0"
          >
            {t.hero.title1}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="inline-block text-gradient font-serif italic font-normal"
          >
            {t.hero.title2}
          </motion.span>
        </h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-white/80 max-w-xl mx-auto font-light leading-relaxed mb-6 sm:mb-7"
        >
          {t.hero.subtitle}
        </motion.p>

        {/* SEARCH BAR */}
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-6xl mx-auto relative z-50"
        >
          <div className="bg-white dark:bg-[#0E0E1A] rounded-2xl sm:rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.12)] border border-gray-200/80 dark:border-white/10 p-2 sm:p-2.5 relative z-50">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col lg:flex-row lg:items-center text-start relative"
            >
              {/* 1. CHOOSE A CITY */}
              <CitySelectDropdown
                isOpen={activeDropdown === "city"}
                onToggle={() => setActiveDropdown(activeDropdown === "city" ? null : "city")}
                selectedCity={selectedCity}
                onSelectCity={(cityId) => {
                  setSelectedCity(cityId);
                  setActiveDropdown(null);
                }}
                chooseCityLabel={t.hero.chooseCity}
                searchPlaceholder={t.hero.citySearchPlaceholder}
                activeCityName={activeCityName}
                getCityLabel={getCityLabel}
              />

              {/* 2. PROPERTY TYPE */}
              <PropertyTypeDropdown
                isOpen={activeDropdown === "type"}
                onToggle={() => setActiveDropdown(activeDropdown === "type" ? null : "type")}
                onClose={() => setActiveDropdown(null)}
                selectedCategory={selectedCategory}
                onSelectCategory={(id) => setSelectedCategory(id)}
                propertyTypeLabel={t.hero.propertyType}
                chooseUnitTypeLabel={t.hero.chooseUnitType}
                activeTypeName={activeTypeName}
                language={language}
                getTypeLabel={getTypeLabel}
              />

              {/* 3. CHECK-IN / CHECK-OUT DATES */}
              <DateRangeDropdown
                isOpen={activeDropdown === "date"}
                onToggle={() => setActiveDropdown(activeDropdown === "date" ? null : "date")}
                onClose={() => setActiveDropdown(null)}
                checkinDate={checkinDate}
                checkoutDate={checkoutDate}
                onDayClick={handleDayClick}
                dateRangeDisplay={dateRangeDisplay()}
                checkInDateLabel={t.hero.checkInDate}
                calendarHelpLabel={t.hero.calendarHelp}
                doneLabel={t.hero.done}
                language={language}
                viewDate={viewDate}
                onPrevMonth={() =>
                  setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
                }
                onNextMonth={() =>
                  setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
                }
                todayISO={getTodayISO()}
              />

              {/* 4. GUESTS & ROOMS COUNTER */}
              <GuestsCounterDropdown
                isOpen={activeDropdown === "guests"}
                onToggle={() => setActiveDropdown(activeDropdown === "guests" ? null : "guests")}
                onClose={() => setActiveDropdown(null)}
                guestsCount={guestsCount}
                adults={adults}
                childrenCount={children}
                rooms={rooms}
                onAdultsChange={setAdults}
                onChildrenChange={setChildren}
                onRoomsChange={setRooms}
                guestsLabel={t.hero.guests}
                selectGuestsLabel={t.hero.selectGuests}
                adultsLabel={t.hero.adults}
                adultsSubLabel={t.hero.adultsSub}
                childrenLabel={t.hero.children}
                childrenSubLabel={t.hero.childrenSub}
                roomsLabel={t.hero.rooms}
                roomsSubLabel={t.hero.roomsSub}
                language={language}
              />

              {/* 5. SEARCH BUTTON */}
              <div className="p-1.5 shrink-0 flex items-center justify-end w-full lg:w-auto">
                <button
                  type="submit"
                  aria-label="Search accommodations"
                  aria-busy="false"
                  className="h-12 w-full lg:w-12 sm:h-13 min-h-[44px] min-w-[44px] rounded-2xl bg-purple-800 hover:bg-purple-900 active:scale-95 text-white flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Search className="w-5 h-5 text-white shrink-0" />
                  <span className="lg:hidden font-bold text-sm">
                    {language === "ar" ? "بحث" : "Search"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
