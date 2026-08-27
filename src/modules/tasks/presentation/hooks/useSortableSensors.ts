import { MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';

/**
 * Sensores compartidos para todo el arrastre del módulo de tareas.
 * Mismo patrón que KanbanBoard: mouse con distancia mínima (distingue click
 * de drag) y touch con delay + tolerance (presión sostenida para arrastrar,
 * toque corto para hacer click y movimiento inmediato para scrollear).
 */
export function useSortableSensors() {
    return useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        })
    );
}