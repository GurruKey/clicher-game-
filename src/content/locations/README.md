# Добавление новых локаций

Чтобы добавить новую локацию в игру, выполните следующие шаги:

## 1. Создайте папку локации
Создайте новую директорию в `src/content/locations/`, например `my_new_location/`.

## 2. Создайте файл лута (`loot.js`)
Определите, какие предметы можно найти в этой локации:
```javascript
export const MY_NEW_LOCATION_LOOT = [
  { id: "stone", chance: 50.0 },
  { id: "wood", chance: 50.0 }
];
```

## 3. Создайте файл конфигурации (`index.js`)
Определите параметры локации:
```javascript
import { MY_NEW_LOCATION_LOOT } from "./loot.js";

export const MY_NEW_LOCATION = {
  id: "my_new_location",
  name: "Название локации",
  coords: { x: 0.5, y: -0.2 }, // Координаты на карте
  workDurationMs: 5000,         // Длительность работы (мс)
  requiredResourceId: "max_stamina",
  resourceCost: 10.0,
  lootTable: MY_NEW_LOCATION_LOOT
};
```

## 4. Зарегистрируйте локацию
Откройте `src/content/locations/index.js` и:
1. Импортируйте ваш новый объект.
2. Добавьте его в массив `ALL_LOCATIONS`.

После этого локация автоматически появится на карте и в списках выбора.
