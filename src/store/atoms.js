import { atom } from 'recoil';
import { masterData } from '../data/masterData';

// Authentication State
const getInitialAuthState = () => {
  return localStorage.getItem('isLoggedIn') === 'true';
};

export const isAuthenticatedState = atom({
  key: 'isAuthenticatedState',
  default: getInitialAuthState(),
  effects: [
    ({ onSet }) => {
      onSet((newValue) => {
        localStorage.setItem('isLoggedIn', newValue);
      });
    },
  ],
});

// UI States
export const sidebarState = atom({
    key: 'sidebarState',
    default: true,
});

export const userState = atom({
    key: 'userState',
    default: {name: 'Amit Kumar', role: 'Senior Developer'},
});

// Helper to generate initial 80 unit boxes for testing
const generateInitialData = () => {
  const initialBoxes = [];
  masterData.forEach(item => {
    item.batches.forEach(batch => {
      for (let i = 1; i <= 10; i++) {
        const boxNo = i.toString().padStart(3, '0');
        const barcode = `${item.itemCode}-${batch}-${boxNo}`;
        initialBoxes.push({
          id: barcode,
          itemCode: item.itemCode,
          batchCode: batch,
          barcode: barcode,
          boxNo: boxNo,
          status: 'GENERATED',
          createdAt: new Date().toISOString()
        });
      }
    });
  });
  return initialBoxes;
};

const getInitialState = (key, defaultVal) => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultVal;
};

const persistState = (key) => ({ onSet }) => {
  onSet(newValue => {
    localStorage.setItem(key, JSON.stringify(newValue));
  });
};

export const unitBoxesDBState = atom({
  key: 'unitBoxesDBState_v2',
  default: getInitialState('unitBoxesDB_v2', generateInitialData()),
  effects: [persistState('unitBoxesDB_v2')]
});

export const qcState = atom({
  key: 'qcState_v2',
  default: getInitialState('qcStateDB_v2', []),
  effects: [persistState('qcStateDB_v2')]
});

export const combinedBoxesDBState = atom({
  key: 'combinedBoxesDBState_v2',
  default: getInitialState('combinedBoxesDB_v2', []),
  effects: [persistState('combinedBoxesDB_v2')]
});
