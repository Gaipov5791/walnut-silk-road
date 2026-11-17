# Walnut Silk Road

Привет! Я начинаю разработку нового приложения. Ты фронтенд разработчик! Твоя задача: 
1. Проверить прикрепленный файл с ТЗ (Walnut_Export_Hub_MVP_TZ_2026.docx).
2. Разработать полностью рабочее фронтенд демо-приложение для B2B экспортных продаж грецкого ореха (Кыргызстан -> Польша / ЕС) по ТЗ. Логику на сервере/бэкенд мы разработаем позже после демонстрации партнерам, сейчас делаем полностью интерактивный клиентский фронтенд с локальным состоянием и реалистичными демо-данными.
3. Проект нужен для демонстрации партнерам из ЕС, чтобы они могли протестировать ключевые B2B-сценарии и дать согласие на сотрудничество.
4. Включить согласованные UI/UX улучшения строго в рамках ТЗ:
- Переключатель ролей (Owner EU, Operator KG, QC / Consultant, Buyer) для демонстрации RBAC и защиты коммерческой маржи (AT-01: оператор КР не видит маржу ЕС).
- Мультиязычность RU / EN и переключение валют (EUR, USD, PLN, KGS).
- База поставщиков КР и реестр партий (Lots) с сортностью по UNECE DDP-02 (половинки «бабочка», четвертинки, микс, цвет ядра) и жестким Quality Safety Gate (проверка на афлатоксины B1 <= 2 мкг/кг, сумма <= 4 мкг/кг по регламенту ЕС 2023/915 и происхождения GSP+). Блокировка статуса Approved без QC-файлов (AT-02).
- CRM европейских покупателей и оформление запросов RFQ.
- Интерактивный калькулятор Landed-Cost (расчет стоимости закупки в КР, автоперевозки TIR, страховки, брокера, пошлин/НДС, валют KGS/USD/EUR/PLN, Incoterms FCA Бишкек / DAP Варшава и маржи).
- Генерация и предпросмотр документов в боковой шторке (Product Spec Sheet, Proforma Invoice draft).
- Трекинг образцов (Sample Pipeline: заявка, отправка, трек-номер, дегустационный отзыв) и неизменяемый журнал аудита (Audit Log).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://walnut-silk-road.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c905fb97-8327-411b-bffb-8ecaab098d6c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
