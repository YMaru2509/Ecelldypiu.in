// The entire attendance-request status lifecycle lives here — every approval
// endpoint calls this instead of setting a status string by hand, so the rules
// from the PRD (sequential approval, remarks required on reject/correction,
// resubmission restarts both stages) are enforced in exactly one place.
export const STATUS = {
    PENDING_VH: 'Pending Vertical Head Approval',
    PENDING_BOARD: 'Pending Board Member Approval',
    CORRECTION_REQUESTED: 'Correction Requested',
    REJECTED_VH: 'Rejected by Vertical Head',
    REJECTED_BOARD: 'Rejected by Board Member',
    APPROVED_SYNC_PENDING: 'Approved – Sync Pending',
    APPROVED_SYNCED: 'Approved – Synced',
    SYNC_FAILED: 'Sync Failed',
};

const RESUBMITTABLE = [STATUS.CORRECTION_REQUESTED, STATUS.REJECTED_VH, STATUS.REJECTED_BOARD];

export function canResubmit(status) {
    return RESUBMITTABLE.includes(status);
}

export function stageForStatus(status) {
    if (status === STATUS.PENDING_VH) return 'vertical_head';
    if (status === STATUS.PENDING_BOARD) return 'board_member';
    return null;
}

// Applies an approve/reject/request_correction action to a request currently
// awaiting approval. Throws a plain Error (callers wrap as 400s) on anything
// invalid — wrong status, missing remarks, unknown action.
export function applyApprovalAction({ currentStatus, action, remarks }) {
    const stage = stageForStatus(currentStatus);
    if (!stage) {
        throw new Error(`Request is not awaiting approval (current status: ${currentStatus})`);
    }

    if (!['approve', 'reject', 'request_correction'].includes(action)) {
        throw new Error(`Unknown action "${action}"`);
    }

    if (action !== 'approve' && !remarks?.trim()) {
        throw new Error('Remarks are required to reject or request a correction');
    }

    if (stage === 'vertical_head') {
        if (action === 'approve') return { nextStatus: STATUS.PENDING_BOARD, stage };
        if (action === 'reject') return { nextStatus: STATUS.REJECTED_VH, stage };
        return { nextStatus: STATUS.CORRECTION_REQUESTED, stage };
    }

    // stage === 'board_member'
    if (action === 'approve') return { nextStatus: STATUS.APPROVED_SYNC_PENDING, stage };
    if (action === 'reject') return { nextStatus: STATUS.REJECTED_BOARD, stage };
    return { nextStatus: STATUS.CORRECTION_REQUESTED, stage };
}
