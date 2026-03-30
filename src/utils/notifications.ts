import { toast } from 'react-toastify';
import type { ToastOptions, TypeOptions } from 'react-toastify';
import Swal from 'sweetalert2';

const toastConfig: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'light'
};

type NotifyFn = (message: string, options?: Partial<ToastOptions>) => void;

export const notify: Record<TypeOptions, NotifyFn> & { default: NotifyFn } = {
  success: (message, options) => toast.success(message, { ...toastConfig, ...options }),
  error: (message, options) => toast.error(message, { ...toastConfig, ...options }),
  info: (message, options) => toast.info(message, { ...toastConfig, ...options }),
  warning: (message, options) => toast.warning(message, { ...toastConfig, ...options }),
  default: (message, options) => toast(message, { ...toastConfig, ...options })
};

interface ConfirmOptions {
  title?: string;
  text?: string;
  icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
}

const defaultSwalConfig = {
  confirmButtonColor: '#7C5DFA',
  cancelButtonColor: '#888EA8',
  reverseButtons: true,
  allowOutsideClick: false
};

export const confirm = async (options: ConfirmOptions) => {
  const result = await Swal.fire({
    ...defaultSwalConfig,
    ...options,
    showCancelButton: true
  });
  return result.isConfirmed;
};

export const alert = async (options: ConfirmOptions) => {
  await Swal.fire({
    ...defaultSwalConfig,
    ...options,
    showCancelButton: false
  });
};
