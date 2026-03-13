---
description: Describe when these instructions should be loaded by the agent based on task context
# applyTo: 'Describe when these instructions should be loaded by the agent based on task context' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

# Kontekst Projektu

Aplikacja "ChordApp" do zarządzania i wyświetlania piosenek z akordami.
Frontend: Nuxt 3 (Vue 3, TypeScript, Tailwind CSS).
Backend: Java Spring Boot / Python (FastAPI/Flask).
Format danych: ChordPro.

# Wytyczne kodowania

- **Nuxt/Vue:** Używaj wyłącznie Composition API z `<script setup lang="ts">`.
- **Stylizacja:** Używaj Tailwind CSS. Unikaj pisania czystego CSS w blokach <style>.
- **Komponenty:** Twórz małe, reużywalne komponenty (np. `ChordDisplay`, `SongMetadata`).
- **Logika akordów:** Wszystkie operacje na tekście ChordPro (transpozycja, parsowanie) powinny być wydzielone do kompozybli (np. `useChordParser.ts`).
- **Typowanie:** Wymagane ścisłe typowanie TypeScript dla interfejsów piosenek i sekcji.

# Zasady domenowe

- Akordy w tekście są zapisywane w formacie [Am], [Cmaj7] itd.
- Renderowanie musi wspierać zmianę tonacji (transpozycję) w locie bez przeładowania strony.
