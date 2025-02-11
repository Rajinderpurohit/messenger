export default FormatTime;
function FormatTime(dateInput) {
  if(!dateInput){
    return '';
  }
    const now = new Date();
    const date = new Date(dateInput);
    const isToday = now.toDateString() === date.toDateString();
    
    // Format "00:00 AM/PM" if the date is today
    if (isToday) {
      // const hours = date.getHours() % 12 || 12; // convert to 12-hour format
      // const minutes = date.getMinutes().toString().padStart(2, '0');
      // const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
      // return `${hours}:${minutes} ${ampm}`;
      return 'Today';
    }
    
    // Format "Yesterday" if the date was yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Format date as "8 Nov 2024" otherwise
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }