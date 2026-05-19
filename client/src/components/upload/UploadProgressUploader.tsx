import { useUploader, UseUploaderOptions } from '@/hooks/useUploader';
import { useOnlineResume } from '@/hooks/useOnlineResume';
import { UploadDropzone } from './UploadDropzone';
import { UploadQueue } from './UploadQueue';

interface Props extends UseUploaderOptions {
  label?: string;
  hint?: string;
  disabled?: boolean;
  hideDropzoneWhenFull?: number;
}

export function UploadProgressUploader(props: Props) {
  const { label, hint, disabled, hideDropzoneWhenFull, ...opts } = props;
  const { items, enqueue, cancel, retry, remove } = useUploader(opts);
  useOnlineResume(retry);

  const successCount = items.filter((i) => i.status === 'success').length;
  const dropzoneHidden =
    typeof hideDropzoneWhenFull === 'number' && successCount >= hideDropzoneWhenFull;

  return (
    <div className="space-y-3">
      {!dropzoneHidden && (
        <UploadDropzone
          accept={opts.accept}
          multiple={opts.multiple}
          disabled={disabled}
          onFiles={enqueue}
          label={label}
          hint={hint}
        />
      )}
      <UploadQueue items={items} onCancel={cancel} onRetry={retry} onRemove={remove} />
    </div>
  );
}
