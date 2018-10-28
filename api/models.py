import enum
from sqlalchemy import ForeignKey, Column, Integer, String, DateTime, Boolean, func, Enum, Text, Index, Numeric
from sqlalchemy.dialects.mysql import BIGINT, INTEGER, NUMERIC, CHAR
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Address(Base):
    __tablename__ = "addresses"

    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    address = Column(CHAR(42), nullable=False)
    __table_args__ = (
        Index('address_idx', 'address', unique=True, mysql_length=42),
    )


class Balance(Base):
    __tablename__ = "balances"

    address_id = Column(INTEGER(unsigned=True), ForeignKey('addresses.id'), primary_key=True)
    address = relationship("Address", foreign_keys=[address_id])
    balance_date = Column(BIGINT(unsigned=True), nullable=False, primary_key=True)
    earned = Column(Boolean(), nullable=False, primary_key=True)
    delta = Column(NUMERIC(32, unsigned=False), nullable=False)


class TransactionCount(Base):
    __tablename__ = "transactions"

    address_id = Column(INTEGER(unsigned=True), ForeignKey('addresses.id'), primary_key=True)
    address = relationship("Address", foreign_keys=[address_id])
    transaction_date = Column(BIGINT(unsigned=True), nullable=False, primary_key=True)
    earned = Column(Boolean(), nullable=False, primary_key=True)
    total = Column(INTEGER(unsigned=True), nullable=False)


class DailyAggregate(Base):
    __tablename__ = "daily_aggregates"

    transaction_date = Column(BIGINT(unsigned=True), nullable=False, primary_key=True)
    difficulty = Column(NUMERIC(32, unsigned=False), nullable=False)
    transactions = Column(INTEGER(unsigned=True), nullable=False)
    block = Column(INTEGER(unsigned=True), nullable=False)


class ValidateStatus(Base):
    __tablename__ = "validate_status"

    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    current_full_validate_block = Column(INTEGER(unsigned=True), nullable=False)
    last_rich_list_build = Column(INTEGER(unsigned=True), nullable=False)


class RichListEntry(Base):
    __tablename__ = "rich_list_entry"

    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    address_id = Column(INTEGER(unsigned=True), ForeignKey('addresses.id'), primary_key=True)
    address = relationship("Address", foreign_keys=[address_id])
    rank = Column(INTEGER(unsigned=True), nullable=False)


