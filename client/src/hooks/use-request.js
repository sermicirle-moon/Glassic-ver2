import axios from 'axios';
import { useState } from 'react';

export default ({ url, method, body, onSuccess }) => {
  const [errors, setErrors] = useState(null);
  const [loading, setLoading] = useState(false);

  const doRequest = async (props = {}) => {
    try {
      setErrors(null);
      setLoading(true);
      const response = await axios[method](url, { ...body, ...props });
      setLoading(false);

      if (onSuccess) {
        onSuccess(response.data);
      }

      return response.data;
    } catch (err) {
      setLoading(false);
      const errorList = err.response?.data?.errors;

      setErrors(
        <div className="alert alert-danger my-3 rounded-1 border" role="alert">
          <div className="fw-semibold small mb-1">
            Thông báo lỗi:
          </div>
          <ul className="mb-0 ps-3 small">
            {Array.isArray(errorList) && errorList.length > 0 ? (
              errorList.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))
            ) : (
              <li>{err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.'}</li>
            )}
          </ul>
        </div>
      );
    }
  };

  return { doRequest, errors, loading };
};
