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
import { LocalizedInput, FIELD_INPUT } from "./LocalizedInput";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { MenuPageState } from "../useMenuPage";
import type { LocalizedText } from "../types";

export function ProductModal({ s }: { s: MenuPageState }) {
  const { t, lang } = useTranslation();
  const { showToast } = useToast();
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState<LocalizedText>(EMPTY_LOCALIZED);
  const [nameLocked, setNameLocked] = useState<string[]>([]);
  const [desc, setDesc] = useState<LocalizedText>(EMPTY_LOCALIZED);
  const [descLocked, setDescLocked] = useState<string[]>([]);
  const [sourceLang, setSourceLang] = useState<MenuLang>("en");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [available, setAvailable] = useState(true);

  // Reset the form when the modal opens (sync from the edited product).
  useEffect(() => {
    if (!s.productOpen) return;
    const p = s.editProduct;
    /* eslint-disable react-hooks/set-state-in-effect -- form reset on open */
    setCategoryId(
      p?.categoryId || s.productCategoryId || s.categories[0]?._id || "",
    );
    setName(p ? { ...EMPTY_LOCALIZED, ...p.nameI18n } : EMPTY_LOCALIZED);
    setNameLocked(p?.nameI18nLocked || []);
    setDesc(p ? { ...EMPTY_LOCALIZED, ...p.descI18n } : EMPTY_LOCALIZED);
    setDescLocked(p?.descI18nLocked || []);
    setSourceLang((p?.sourceLang as MenuLang) || "en");
    setPrice(p ? String(p.price) : "");
    setImageUrl(p?.imageUrl || "");
    setAvailable(p ? p.available : true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [s.productOpen, s.editProduct, s.productCategoryId, s.categories]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const source = name[sourceLang];
    if (!source.trim() || !categoryId) return;
    s.saveProduct({
      categoryId,
      name: source,
      nameI18n: name,
      nameI18nLocked: nameLocked,
      description: desc[sourceLang],
      descI18n: desc,
      descI18nLocked: descLocked,
      price: Math.max(0, Math.round(Number(price) || 0)),
      imageUrl,
      available,
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
      open={s.productOpen}
      onClose={() => s.setProductOpen(false)}
      title={s.editProduct ? t("editProduct") : t("addProduct")}
      size="md"
      closeLabel={t("close")}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => s.setProductOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" form="product-form" loading={s.saving}>
            {t("save")}
          </Button>
        </div>
      }
    >
      <form
        id="product-form"
        onSubmit={submit}
        className="flex flex-col gap-3.5"
      >
        <div className="grid grid-cols-2 max-[480px]:grid-cols-1 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
              {t("category")}
            </label>
            <Dropdown
              value={categoryId}
              onChange={setCategoryId}
              options={s.categories.map((c) => ({
                value: c._id,
                label: c.nameI18n?.[lang] || c.name,
              }))}
              ariaLabel={t("category")}
            />
          </div>
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
        </div>

        <LocalizedInput
          label={t("productName")}
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
            label={t("productImage")}
            value={imageUrl}
            onChange={setImageUrl}
            scope="products"
          />
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 accent-(--brand-500)"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
          <span className="text-sm text-(--gray-700) font-medium">
            {t("availableForOrder")}
          </span>
        </label>
      </form>
    </Modal>
  );
}
