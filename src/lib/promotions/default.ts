import type {Promotion} from './contracts';

export const defaultPromotion: Promotion = {
  id: 'featured-parts',
  enabled: true,
  mileage: '75 719',
  ecu: '89530-70130 / 324811-13890',
  image: '',
  content: {
    uk: {
      title: 'Двигун та КПП Peugeot 107',
      vehicle: 'Peugeot 107, 1.0 бензин, 2005–2014',
      condition: 'Двигун і коробка в дуже хорошому стані.',
      transmission: 'Роботизована 2-Tronic, 5 передач, тип 20TT02.',
      included:
        'Зчеплення\nАктуатор зчеплення\nМеханізм вибору та перемикання передач\nПроводка\nЕБУ\nПедаль гальма\nСалонний важіль',
      engine: '1.0 бензин.',
      terms:
        'Ціна, сумісність, комплектація двигуна та умови придбання — за запитом.',
    },
    ru: {
      title: 'Двигатель и КПП Peugeot 107',
      vehicle: 'Peugeot 107, 1.0 бензин, 2005–2014',
      condition: 'Двигатель и коробка в очень хорошем состоянии.',
      transmission: 'Роботизированная 2-Tronic, 5 передач, тип 20TT02.',
      included:
        'Сцепление\nАктуатор сцепления\nМеханизм выбора и переключения передач\nПроводка\nЭБУ\nПедаль тормоза\nСалонный рычаг',
      engine: '1.0 бензин.',
      terms:
        'Цена, совместимость, комплектация двигателя и условия покупки — по запросу.',
    },
    en: {
      title: 'Peugeot 107 engine & gearbox',
      vehicle: 'Peugeot 107, 1.0 petrol, 2005–2014',
      condition: 'Engine and gearbox in very good condition.',
      transmission: 'Robotised 2-Tronic, 5 speeds, type 20TT02.',
      included:
        'Clutch\nClutch actuator\nGear selection and shift mechanism\nWiring\nECU\nBrake pedal\nInterior gear lever',
      engine: '1.0 petrol.',
      terms:
        'Price, compatibility, engine configuration and purchase conditions available on request.',
    },
  },
};
