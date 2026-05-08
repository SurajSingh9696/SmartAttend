import cron from 'node-cron';
import { connectDB } from '@/lib/db';
import Timetable from '@/models/Timetable';

let started = false;

export function startCronJobs() {
  if (started) return;
  started = true;

  // Every minute: open/close attendance windows based on timetable
  cron.schedule('* * * * *', async () => {
    try {
      await connectDB();
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...

      const allSlots = await Timetable.find({ dayOfWeek });

      for (const slot of allSlots) {
        const [sh, sm] = slot.startTime.split(':').map(Number);
        const [eh, em] = slot.endTime.split(':').map(Number);

        const windowOpen = new Date(now);
        windowOpen.setHours(sh, sm - 10, 0, 0); // open 10 min before

        const windowClose = new Date(now);
        windowClose.setHours(sh, sm + 5, 0, 0); // close 5 min after start

        const classEnd = new Date(now);
        classEnd.setHours(eh, em, 0, 0);

        const shouldBeOpen = now >= windowOpen && now <= windowClose;
        const ended = now > classEnd;

        if (shouldBeOpen && !slot.attendanceWindowOpen) {
          await Timetable.findByIdAndUpdate(slot._id, {
            attendanceWindowOpen: true,
            attendanceWindowOpenAt: windowOpen,
            attendanceWindowCloseAt: windowClose,
          });
        } else if ((!shouldBeOpen || ended) && slot.attendanceWindowOpen) {
          await Timetable.findByIdAndUpdate(slot._id, {
            attendanceWindowOpen: false,
          });
        }
      }
    } catch (err) {
      console.error('[cron] attendance window error:', err);
    }
  });

  console.log('[cron] Attendance window scheduler started');
}