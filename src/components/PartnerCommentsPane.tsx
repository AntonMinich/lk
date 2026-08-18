import { useMemo, useState, type FormEvent } from "react";
import { formatDateTime } from "../lib/format";
import { addPartnerComment, listPartnerComments } from "../lib/partner-comments";

type PartnerCommentsPaneProps = {
  partnerId: string;
  author: string;
  onChange?: () => void;
};

export function PartnerCommentsPane({ partnerId, author, onChange }: PartnerCommentsPaneProps) {
  const [text, setText] = useState("");
  const [revision, setRevision] = useState(0);
  const comments = useMemo(() => listPartnerComments(partnerId), [partnerId, revision]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const created = addPartnerComment({ partnerId, text, author });
    if (!created) {
      return;
    }
    setText("");
    setRevision((value) => value + 1);
    onChange?.();
  }

  return (
    <div className="comment-pane">
      <form className="comment-form" onSubmit={handleSubmit}>
        <label className="comment-form__label" htmlFor="partner-comment">
          Новая запись
        </label>
        <textarea
          id="partner-comment"
          rows={4}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Введите комментарий"
        />
        <button type="submit" className="action-btn action-btn--approve" disabled={!text.trim()}>
          Добавить
        </button>
      </form>
      {comments.length === 0 ? (
        <p className="admin-docs__empty">Пока нет комментариев</p>
      ) : (
        <ul className="comment-list">
          {comments.map((item) => (
            <li key={item.id} className="comment-card">
              <div className="comment-card__meta">
                <strong>{item.author}</strong>
                <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
              </div>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
