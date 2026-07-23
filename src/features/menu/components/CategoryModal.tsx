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
import { LocalizedInput } from "./LocalizedInput";
import type { MenuPageState } from "../useMenuPage";
import type { LocalizedText } from "../types";

export function CategoryModal({ s }: { s: MenuPageState }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [name, setName] = useState<LocalizedText>(EMPTY_LOCALIZED);
  const [sourceLang, setSourceLang] = useState<MenuLang>("en");
  const [locked, setLocked] = useState<string[]>([]);

  useEffect(() => {
    if (!s.categoryOpen) return;
    /* eslint-disable react-hooks/set-state-in-effect -- form reset on open */
    setName(
      s.editCategory
        ? { ...EMPTY_LOCALIZED, ...s.editCategory.nameI18n }
        : EMPTY_LOCALIZED,
    );
    setSourceLang((s.editCategory?.sourceLang as MenuLang) || "en");
    setLocked(s.editCategory?.nameI18nLocked || []);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [s.categoryOpen, s.editCategory]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const source = name[sourceLang];
    if (!source.trim()) return;
    s.saveCategory({
      name: source,
      nameI18n: name,
      nameI18nLocked: locked,
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
      open={s.categoryOpen}
      onClose={() => s.setCategoryOpen(false)}
      title={s.editCategory ? t("editCategory") : t("addCategory")}
      size="sm"
      closeLabel={t("close")}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => s.setCategoryOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" form="category-form" loading={s.saving}>
            {t("save")}
          </Button>
        </div>
      }
    >
      <form
        id="category-form"
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
          label={t("categoryName")}
          value={name}
          onChange={setName}
          sourceLang={sourceLang}
          locked={locked}
          onLockedChange={setLocked}
          onTranslate={handleTranslate}
          placeholder={t("categoryNamePlaceholder")}
        />
      </form>
    </Modal>
  );
}
