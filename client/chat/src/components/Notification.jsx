import { useEffect } from 'react';
import notificationSound from '../assets/notification.wav';

function NotificationSound({ triggerEvent }) {
  const sound = new Audio(notificationSound);
  useEffect(() => {
    if (triggerEvent) {
      sound.play();
    }
  }, [triggerEvent]);

  return true;
}

export default NotificationSound;
