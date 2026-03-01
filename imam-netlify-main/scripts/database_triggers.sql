-- Create notifications for new contact messages
CREATE OR REPLACE FUNCTION notify_new_contact_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (title, message, type, is_read, source_id, source_type)
  VALUES (
    'رسالة تواصل جديدة',
    'رسالة من ' || COALESCE(NEW.name, 'زائر') || ': ' || COALESCE(NEW.subject, 'بدون موضوع'),
    'contact',
    false,
    NEW.id,
    'contact_message'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notifications for new subscribers
CREATE OR REPLACE FUNCTION notify_new_subscriber()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (title, message, type, is_read, source_id, source_type)
  VALUES (
    'مشترك جديد',
    'انضم مشترك جديد: ' || COALESCE(NEW.whatsapp_number, NEW.telegram_username, 'بدون رقم'),
    'subscriber',
    false,
    NEW.id,
    'subscriber'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_new_contact_message ON public.contact_messages;
CREATE TRIGGER trigger_new_contact_message
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_contact_message();

DROP TRIGGER IF EXISTS trigger_new_subscriber ON public.subscribers;
CREATE TRIGGER trigger_new_subscriber
  AFTER INSERT ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION notify_new_subscriber();
