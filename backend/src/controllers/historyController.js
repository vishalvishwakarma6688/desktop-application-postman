import RequestHistory from '../models/RequestHistory.js';

// @desc    Get request history for authenticated user
// @route   GET /api/history
// @access  Private
export const getHistory = async (req, res, next) => {
    try {
        const { limit = 50, skip = 0 } = req.query;

        const history = await RequestHistory.find({ user: req.user.userId })
            .populate('request', 'name method url')
            .populate('workspace', 'name')
            .sort({ executedAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await RequestHistory.countDocuments({ user: req.user.userId });

        res.status(200).json({ success: true, count: history.length, total, data: history });
    } catch (error) {
        next(error);
    }
};

// @desc    Get history by ID
// @route   GET /api/history/:id
// @access  Private
export const getHistoryById = async (req, res, next) => {
    try {
        const history = await RequestHistory.findById(req.params.id)
            .populate('request', 'name method url')
            .populate('workspace', 'name')
            .populate('user', 'name email');

        if (!history) {
            const error = new Error('History record not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        if (history.user._id.toString() !== req.user.userId) {
            const error = new Error('Access denied to this history record');
            error.statusCode = 403;
            error.name = 'AuthorizationError';
            return next(error);
        }

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

// @desc    Get history for a specific request
// @route   GET /api/history/request/:requestId
// @access  Private
export const getHistoryByRequest = async (req, res, next) => {
    try {
        const { limit = 20, skip = 0 } = req.query;

        const history = await RequestHistory.find({
            request: req.params.requestId,
            user: req.user.userId
        })
            .sort({ executedAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.status(200).json({ success: true, count: history.length, data: history });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete history record
// @route   DELETE /api/history/:id
// @access  Private
export const deleteHistory = async (req, res, next) => {
    try {
        const history = await RequestHistory.findById(req.params.id);

        if (!history) {
            const error = new Error('History record not found');
            error.statusCode = 404;
            error.name = 'NotFoundError';
            return next(error);
        }

        if (history.user.toString() !== req.user.userId) {
            const error = new Error('Access denied to this history record');
            error.statusCode = 403;
            error.name = 'AuthorizationError';
            return next(error);
        }

        await history.deleteOne();

        res.status(200).json({ success: true, message: 'History record deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear all history for authenticated user
// @route   DELETE /api/history
// @access  Private
export const clearHistory = async (req, res, next) => {
    try {
        const result = await RequestHistory.deleteMany({ user: req.user.userId });
        res.status(200).json({ success: true, message: `Deleted ${result.deletedCount} history records` });
    } catch (error) {
        next(error);
    }
};

// @desc    Get distinct URLs from user's request history (for autocomplete)
// @route   GET /api/history/url-suggestions
// @access  Private
export const getUrlSuggestions = async (req, res, next) => {
    try {
        const { q = '' } = req.query;
        const history = await RequestHistory.find({ user: req.user.userId })
            .select('requestSnapshot.url requestSnapshot.method')
            .sort({ executedAt: -1 })
            .limit(200);

        const seen = new Set();
        const suggestions = [];
        for (const h of history) {
            const url = h.requestSnapshot?.url;
            const method = h.requestSnapshot?.method;
            if (!url) continue;
            const key = `${method}:${url}`;
            if (seen.has(key)) continue;
            if (q && !url.toLowerCase().includes(q.toLowerCase())) continue;
            seen.add(key);
            suggestions.push({ url, method });
            if (suggestions.length >= 20) break;
        }

        res.status(200).json({ success: true, data: suggestions });
    } catch (error) {
        next(error);
    }
};
