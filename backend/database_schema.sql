--
-- PostgreSQL database dump
--

\restrict h1RpJ1sQmy3lwPYS6EGL8cUWDo57dbBHbBcbhkzcsv1Is4yb2l7ciMduWIHKLHs

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: barang; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.barang (
    id integer NOT NULL,
    nama character varying(100) NOT NULL,
    kategori character varying(50) NOT NULL,
    harga numeric(12,2) NOT NULL,
    stok integer DEFAULT 0 NOT NULL,
    satuan character varying(20) DEFAULT 'pcs'::character varying NOT NULL,
    foto text,
    deskripsi text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT barang_harga_check CHECK ((harga >= (0)::numeric)),
    CONSTRAINT barang_stok_check CHECK ((stok >= 0))
);


--
-- Name: barang_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.barang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: barang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.barang_id_seq OWNED BY public.barang.id;


--
-- Name: detail_pesanan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detail_pesanan (
    id bigint NOT NULL,
    pesanan_id bigint NOT NULL,
    barang_id integer NOT NULL,
    nama_barang character varying(100) NOT NULL,
    harga numeric(12,2) NOT NULL,
    jumlah integer NOT NULL,
    subtotal numeric(14,2) NOT NULL,
    CONSTRAINT detail_pesanan_harga_check CHECK ((harga >= (0)::numeric)),
    CONSTRAINT detail_pesanan_jumlah_check CHECK ((jumlah > 0)),
    CONSTRAINT detail_pesanan_subtotal_check CHECK ((subtotal >= (0)::numeric))
);


--
-- Name: detail_pesanan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.detail_pesanan ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.detail_pesanan_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pesanan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pesanan (
    id bigint NOT NULL,
    kode_pesanan character varying(40) NOT NULL,
    nama_pelanggan character varying(100),
    no_hp character varying(25),
    alamat text,
    metode_pembayaran character varying(10) NOT NULL,
    status character varying(30) NOT NULL,
    total numeric(12,2) NOT NULL,
    batas_waktu timestamp with time zone,
    dibuat_pada timestamp with time zone DEFAULT now() NOT NULL,
    diperbarui_pada timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pesanan_metode_pembayaran_check CHECK (((metode_pembayaran)::text = ANY ((ARRAY['QRIS'::character varying, 'COD'::character varying])::text[]))),
    CONSTRAINT pesanan_status_check CHECK (((status)::text = ANY ((ARRAY['menunggu_pembayaran'::character varying, 'menunggu_konfirmasi'::character varying, 'diproses'::character varying, 'dibayar'::character varying, 'selesai'::character varying, 'dibatalkan'::character varying])::text[]))),
    CONSTRAINT pesanan_total_check CHECK ((total >= (0)::numeric))
);


--
-- Name: pesanan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.pesanan ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.pesanan_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: reservasi_stok; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservasi_stok (
    id bigint NOT NULL,
    pesanan_id bigint NOT NULL,
    barang_id integer NOT NULL,
    jumlah integer NOT NULL,
    status character varying(15) DEFAULT 'aktif'::character varying NOT NULL,
    dibuat_pada timestamp with time zone DEFAULT now() NOT NULL,
    diperbarui_pada timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reservasi_stok_jumlah_check CHECK ((jumlah > 0)),
    CONSTRAINT reservasi_stok_status_check CHECK (((status)::text = ANY ((ARRAY['aktif'::character varying, 'terpakai'::character varying, 'dilepas'::character varying])::text[])))
);


--
-- Name: reservasi_stok_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.reservasi_stok ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.reservasi_stok_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: barang id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.barang ALTER COLUMN id SET DEFAULT nextval('public.barang_id_seq'::regclass);


--
-- Name: barang barang_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.barang
    ADD CONSTRAINT barang_pkey PRIMARY KEY (id);


--
-- Name: detail_pesanan detail_pesanan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detail_pesanan
    ADD CONSTRAINT detail_pesanan_pkey PRIMARY KEY (id);


--
-- Name: pesanan pesanan_kode_pesanan_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pesanan
    ADD CONSTRAINT pesanan_kode_pesanan_key UNIQUE (kode_pesanan);


--
-- Name: pesanan pesanan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pesanan
    ADD CONSTRAINT pesanan_pkey PRIMARY KEY (id);


--
-- Name: reservasi_stok reservasi_stok_pesanan_id_barang_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservasi_stok
    ADD CONSTRAINT reservasi_stok_pesanan_id_barang_id_key UNIQUE (pesanan_id, barang_id);


--
-- Name: reservasi_stok reservasi_stok_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservasi_stok
    ADD CONSTRAINT reservasi_stok_pkey PRIMARY KEY (id);


--
-- Name: idx_detail_pesanan_pesanan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detail_pesanan_pesanan ON public.detail_pesanan USING btree (pesanan_id);


--
-- Name: idx_pesanan_status_batas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pesanan_status_batas ON public.pesanan USING btree (status, batas_waktu);


--
-- Name: idx_reservasi_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reservasi_status ON public.reservasi_stok USING btree (status, pesanan_id);


--
-- Name: detail_pesanan detail_pesanan_barang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detail_pesanan
    ADD CONSTRAINT detail_pesanan_barang_id_fkey FOREIGN KEY (barang_id) REFERENCES public.barang(id) ON DELETE RESTRICT;


--
-- Name: detail_pesanan detail_pesanan_pesanan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detail_pesanan
    ADD CONSTRAINT detail_pesanan_pesanan_id_fkey FOREIGN KEY (pesanan_id) REFERENCES public.pesanan(id) ON DELETE RESTRICT;


--
-- Name: reservasi_stok reservasi_stok_barang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservasi_stok
    ADD CONSTRAINT reservasi_stok_barang_id_fkey FOREIGN KEY (barang_id) REFERENCES public.barang(id) ON DELETE RESTRICT;


--
-- Name: reservasi_stok reservasi_stok_pesanan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservasi_stok
    ADD CONSTRAINT reservasi_stok_pesanan_id_fkey FOREIGN KEY (pesanan_id) REFERENCES public.pesanan(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict h1RpJ1sQmy3lwPYS6EGL8cUWDo57dbBHbBcbhkzcsv1Is4yb2l7ciMduWIHKLHs

