// components/WeekSchedule.jsx
// Drag-and-drop weekly schedule grid powered by @hello-pangea/dnd.
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const TYPE_COLORS = {
  prospect: 'border-l-emerald-500 bg-emerald-500/5',
  client:   'border-l-blue-500 bg-blue-500/5',
};

function StopChip({ stop, index }) {
  return (
    <Draggable draggableId={stop.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`rounded-lg border-l-2 px-3 py-2 text-sm cursor-grab select-none transition-shadow ${
            TYPE_COLORS[stop.type] || 'border-l-slate-500 bg-slate-800/40'
          } ${snapshot.isDragging ? 'shadow-lg shadow-black/40 rotate-1' : 'border border-slate-700/40'}`}
        >
          <p className="font-medium text-slate-200 leading-tight truncate">{stop.name}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{stop.address}</p>
          {stop.driveMinutesFromPrevious > 0 && (
            <p className="text-[10px] text-slate-600 mt-0.5">
              {stop.driveMinutesFromPrevious} min from previous
            </p>
          )}
          {stop.notes && (
            <p className="text-[10px] text-amber-400/80 mt-0.5 italic">{stop.notes}</p>
          )}
        </div>
      )}
    </Draggable>
  );
}

function DayColumn({ day, onDrop }) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400">{day.day}</p>
        <p className="text-[10px] text-slate-600">{day.stops.length} stops</p>
      </div>
      {day.summary && (
        <p className="text-[10px] text-slate-600 leading-relaxed">{day.summary}</p>
      )}
      <Droppable droppableId={day.day}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 min-h-[120px] rounded-xl p-2 border border-dashed transition-colors ${
              snapshot.isDraggingOver
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-700/40 bg-slate-800/20'
            }`}
          >
            {day.stops.map((stop, i) => (
              <StopChip key={stop.id} stop={stop} index={i} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      {day.totalDriveMinutes > 0 && (
        <p className="text-[10px] text-slate-600 text-right">
          ~{Math.round(day.totalDriveMinutes / 60 * 10) / 10}h total drive
        </p>
      )}
    </div>
  );
}

export default function WeekSchedule({ schedule, onScheduleChange }) {
  if (!schedule?.week?.length) return null;

  function handleDragEnd(result) {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newWeek = schedule.week.map((d) => ({ ...d, stops: [...d.stops] }));
    const srcDay  = newWeek.find((d) => d.day === source.droppableId);
    const dstDay  = newWeek.find((d) => d.day === destination.droppableId);
    if (!srcDay || !dstDay) return;

    const [moved] = srcDay.stops.splice(source.index, 1);
    dstDay.stops.splice(destination.index, 0, moved);

    onScheduleChange({ ...schedule, week: newWeek });
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        {schedule.week.map((day) => (
          <DayColumn key={day.day} day={day} />
        ))}
      </div>
      {schedule.unscheduled?.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-xs font-semibold text-amber-400 mb-2">Unscheduled ({schedule.unscheduled.length})</p>
          <p className="text-xs text-slate-500">
            These stops couldn't fit in the 5-day schedule. Add them manually or run another week.
          </p>
        </div>
      )}
    </DragDropContext>
  );
}
