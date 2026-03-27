import { api } from './api';

export const localAuthListApi = {
  getVersion: async (chargePointId: string): Promise<unknown> => {
    const response = await api.get(
      `/local-auth-list/version/${encodeURIComponent(chargePointId)}`,
    );
    return response.data;
  },
};
