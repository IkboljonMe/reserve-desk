"use client";

import { useEffect, useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import { useTranslation } from "@/i18n";
import { useToast } from "@/providers/ToastProvider";
import {
  MENU_LANG_OPTIONS,
  EMPTY_LOCALIZED,
  type MenuLang,
} from "@/lib/menu";
import { translateText } from "@/lib/api/menu";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { LocalizedInput, FIELD_INPUT } from "./LocalizedInput";
import type { GuestServicesState } from "../useGuestServices";
import type { LocalizedText } from "../types";

export function GuestServiceModal({ s }: { s: GuestServicesState }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [name, setName] = useState<LocalizedText>(EMPTY_LOCALIZED);
  const [nameLocked, setNameLocked] = useState<string[]>([]);
  const [desc, setDesc] = useState<LocalizedText>(EMPTY_LOCALIZED);
  const [descLocked, setDescLocked] = useState<string[]>([]);
  const [sourceLang, setSourceLang] = useState<MenuLang>("en");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!s.serviceOpen) return;
    const g = s.editService;
    /* eslint-disable react-hooks/set-state-in-effect -- form reset on open */
    setName(g ? { ...EMPTY_LOCALIZED, ...g.nameI18n } : EMPTY_LOCALIZED);
    setNameLocked(g?.nameI18nLocked || []);
    setDesc(g ? { ...EMPTY_LOCALIZED, ...g.descI18n } : EMPTY_LOCALIZED);
    setDescLocked(g?.descI18nLocked || []);
    setSourceLang((g?.sourceLang as MenuLang) || "en");
    setPrice(g ? String(g.price) : "");
    setImageUrl(g?.imageUrl || "");
    setActive(g ? g.active : true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [s.serviceOpen, s.editService]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const source = name[sourceLang];
    if (!source.trim()) return;
    s.save({
      name: source,
      nameI18n: name,
      nameI18nLocked: nameLocked,
      description: desc[sourceLang],
      descI18n: desc,
      descI18nLocked: descLocked,
      price: Math.max(0, Math.round(Number(price) || 0)),
      imageUrl,
      active,
      sourceLang,
    });
  };

  async function handleTranslate(text: string, source: string, skip: string[]) {
    try {
      return await translateText(text, source, skip);
    } catch {
      showToast(t("translateNotConfigured"), "error");
      return {};
    }
  }

  return (
    <Modal
      open={s.serviceOpen}
      onClose={() => s.setServiceOpen(false)}
      title={s.editService ? t("editService") : t("addService")}
      size="md"
      closeLabel={t("close")}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => s.setServiceOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" form="guest-service-form" loading={s.saving}>
            {t("save")}
          </Button>
        </div>
      }
    >
      <form
        id="guest-service-form"
        onSubmit={submit}
        className="flex flex-col gap-3.5"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
            {t("inputLanguage")}
          </label>
          <Dropdown
            value={sourceLang}
            onChange={(v) => setSourceLang(v as MenuLang)}
            options={MENU_LANG_OPTIONS}
            ariaLabel={t("inputLanguage")}
          />
        </div>

        <LocalizedInput
          label={t("serviceName")}
          value={name}
          onChange={setName}
          sourceLang={sourceLang}
          locked={nameLocked}
          onLockedChange={setNameLocked}
          onTranslate={handleTranslate}
        />
        <LocalizedInput
          label={t("description")}
          value={desc}
          onChange={setDesc}
          sourceLang={sourceLang}
          locked={descLocked}
          onLockedChange={setDescLocked}
          onTranslate={handleTranslate}
          textarea
        />

        <div className="grid grid-cols-2 max-[480px]:grid-cols-1 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
              {t("priceUzs")}
            </label>
            <input
              className={FIELD_INPUT}
              inputMode="numeric"
              value={price}
              placeholder="0"
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <ImageUpload
            label={t("serviceImage")}
            value={imageUrl}
            onChange={setImageUrl}
            scope="products"
          />
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 accent-(--brand-500)"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          <span className="text-sm text-(--gray-700) font-medium">
            {t("visibleInMenu")}
          </span>
        </label>
      </form>
    </Modal>
  );
}
