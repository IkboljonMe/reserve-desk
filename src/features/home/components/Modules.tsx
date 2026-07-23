import {
  MODULES,
  CARD,
  SECTION_TITLE,
  SECTION_SUB,
  type Translate,
} from "../constants";

export function Modules({ t }: { t: Translate }) {
  return (
    <section className="max-w-300 mx-auto px-5 lg:px-10 py-14">
      <h2 className={SECTION_TITLE}>{t("lpModulesTitle")}</h2>
      <p className={SECTION_SUB}>{t("lpModulesSub")}</p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
        {MODULES.map(({ icon: Icon, key }) => (
          <div
            key={key}
            className={`${CARD} bg-white p-5 flex items-center gap-3`}
          >
            <div className="w-9.5 h-9.5 shrink-0 flex items-center justify-center bg-brand-50 text-brand-500">
              <Icon size={19} />
            </div>
            <div>
              <div className="font-bold text-[0.9rem]">{t(`${key}Title`)}</div>
              <div className="text-slate-500 text-[0.78rem] mt-0.5">
                {t(`${key}Desc`)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
