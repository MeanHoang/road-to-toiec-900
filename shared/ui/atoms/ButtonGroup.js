/**
 * Một hàng nút đứng cạnh nhau.
 *
 * CỐ Ý không phải kiểu segmented (dính liền, chung viền, chỉ bo góc ngoài):
 * kiểu đó nói rằng các nút là những lựa chọn NGANG HÀNG của cùng một nhóm, như
 * tab hay công tắc nhiều trạng thái. Nút ở đây thường không ngang hàng — một
 * cái chính, một cái phụ — nên dính chúng làm một khối sẽ khiến nút chính trông
 * như một nửa của cái công tắc.
 *
 * `align="end"` để dồn về bên phải, chỗ hay dùng nhất cho cụm hành động.
 * Màn hẹp thì mỗi nút chiếm trọn một dòng, vì hai nút nhỏ cạnh nhau trên điện
 * thoại là hai vùng bấm hẹp nằm sát — dễ bấm nhầm.
 */
export function ButtonGroup({ align, className = '', children }) {
  const cls = ['btn-group', align === 'end' && 'btn-group-end', className].filter(Boolean).join(' ');
  return <div className={cls}>{children}</div>;
}
